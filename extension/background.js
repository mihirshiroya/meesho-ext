import { evaluate, needsMorePages, summarize, formatInr } from "./lib/thresholds.js";
import { sendTelegram } from "./lib/telegram.js";
import {
  getSettings,
  getState,
  setState,
  getAlertedState,
  setAlertedState,
} from "./lib/storage.js";
import { isWithinActiveHours, nextActiveStart, nextIstTime, istDateString, formatIst } from "./lib/time.js";

const CHECK_ALARM = "check";
const HEARTBEAT_ALARM = "heartbeat";
const ADS_TAB_PATTERN = "https://supplier.meesho.com/panel/v3/new/ads/*";
// e.g. https://supplier.meesho.com/panel/v3/new/ads/qxg7u/advertisement
const ADS_PAGE_RE = /^https:\/\/supplier\.meesho\.com\/panel\/v3\/new\/ads\/([^/?#]+)\/advertisement/;

function identifierFromUrl(url) {
  const match = ADS_PAGE_RE.exec(url || "");
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
const MAX_PAGES = 3;
const NETWORK_RETRY_MIN = 5;
const FIXTURE_DAY = "2026-10-25";

let running = null;

// ---------- scheduling ----------

function randomBetween(min, max) {
  const lo = Math.max(1, Number(min) || 15);
  const hi = Math.max(lo, Number(max) || lo);
  return lo + Math.random() * (hi - lo);
}

async function scheduleCheck(delayMin) {
  const when = Date.now() + delayMin * 60000;
  await chrome.alarms.create(CHECK_ALARM, { when });
  await setState({ nextCheckAt: when });
  return when;
}

async function scheduleNextCycle(settings) {
  let when = Date.now() + randomBetween(settings.intervalMinMin, settings.intervalMaxMin) * 60000;
  if (!isWithinActiveHours(settings.activeStart, settings.activeEnd, new Date(when))) {
    const start = nextActiveStart(settings.activeStart, new Date(when));
    // small jitter so profiles that share active hours do not fire together
    if (start) when = start + (Number(settings.startOffsetMin) || 0) * 60000 + Math.random() * 3 * 60000;
  }
  await chrome.alarms.create(CHECK_ALARM, { when });
  await setState({ nextCheckAt: when });
}

async function scheduleHeartbeat(settings) {
  await chrome.alarms.clear(HEARTBEAT_ALARM);
  const when = nextIstTime(settings.heartbeatTime);
  if (when) await chrome.alarms.create(HEARTBEAT_ALARM, { when });
}

async function resetSchedule({ firstRunSoon = true } = {}) {
  const settings = await getSettings();
  const state = await getState();
  await chrome.alarms.clearAll();
  await scheduleHeartbeat(settings);
  if (state.status === "PAUSED_BY_ERROR") {
    await setState({ nextCheckAt: null });
    return;
  }
  const offset = Number(settings.startOffsetMin) || 0;
  const delay = firstRunSoon ? offset + 1 + Math.random() * 2 : randomBetween(settings.intervalMinMin, settings.intervalMaxMin) + offset;
  await scheduleCheck(delay);
}

// ---------- notifications ----------

function desktopNotify(title, message) {
  return new Promise((resolve) => {
    try {
      chrome.notifications.create(
        {
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title,
          message,
          priority: 2,
        },
        () => resolve(!chrome.runtime.lastError),
      );
    } catch {
      resolve(false);
    }
  });
}

/** Sends to every enabled channel. Never throws. */
async function sendAlert(settings, text, title = "Meesho Ads Monitor") {
  const results = { desktop: false, telegram: null };
  const hasTelegram = Boolean(settings.telegramBotToken && settings.telegramChatId);
  try {
    if (hasTelegram) {
      const res = await sendTelegram(settings.telegramBotToken, settings.telegramChatId, text);
      results.telegram = res.ok ? true : res.error;
    }
    if (settings.desktopNotifications || (hasTelegram && results.telegram !== true) || !hasTelegram) {
      const suffix = hasTelegram && results.telegram !== true ? `\n(Telegram failed: ${results.telegram})` : "";
      results.desktop = await desktopNotify(title, text + suffix);
    }
  } catch {
    // alert path must never throw
  }
  return results;
}

function labelFor(settings, state) {
  return settings.label || state.identifier || "Meesho";
}

// ---------- tab handling ----------

function waitForTabComplete(tabId, timeoutMs = 45000) {
  return new Promise((resolve) => {
    const timer = setTimeout(done, timeoutMs);
    function done() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.tabs.get(tabId).then(resolve, () => resolve(null));
    }
    function listener(id, info) {
      if (id === tabId && info.status === "complete") done();
    }
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then(
      (t) => t?.status === "complete" && done(),
      () => done(),
    );
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findAdsTab(state) {
  if (state.monitorTabId) {
    const tab = await chrome.tabs.get(state.monitorTabId).catch(() => null);
    if (tab?.url && ADS_PAGE_RE.test(tab.url)) return tab;
  }
  const tabs = await chrome.tabs.query({ url: ADS_TAB_PATTERN });
  return tabs.find((t) => ADS_PAGE_RE.test(t.url || "")) || null;
}

async function getOrOpenAdsTab(settings, state) {
  const existing = await findAdsTab(state);
  if (existing) return { tab: existing };

  if (!settings.autoOpenTab) {
    return { error: "account", detail: "No Meesho Ads tab is open and auto-open is off" };
  }
  if (!state.identifier) {
    return { error: "account", detail: "Open the Meesho Ads page once so the account can be detected" };
  }

  const url = `https://supplier.meesho.com/panel/v3/new/ads/${encodeURIComponent(state.identifier)}/advertisement`;
  const created = await chrome.tabs.create({ url, pinned: true, active: false });
  await setState({ monitorTabId: created.id });
  const loaded = await waitForTabComplete(created.id);
  // let page JS (including bot-manager scripts) settle before calling the API
  await sleep(4000);
  const tab = await chrome.tabs.get(created.id).catch(() => loaded);
  if (!tab) return { error: "network", detail: "Meesho tab did not load" };
  if (!ADS_PAGE_RE.test(tab.url || "")) {
    if (/login|signin/i.test(tab.url || "")) return { error: "session", detail: "Redirected to login page" };
    return { error: "session", detail: "Ads page did not open (logged out?)" };
  }
  return { tab };
}

async function messageTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // content script not present (tab opened before install) — inject once and retry
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function cookieFallback() {
  const read = async (name) => {
    const c = await chrome.cookies.get({ url: "https://supplier.meesho.com/", name }).catch(() => null);
    return c?.value || null;
  };
  return { supplierId: await read("s_id"), browserId: await read("browser_id") };
}

// ---------- fetching ----------

function buildBody(settings, pageIndex, fetchedCount) {
  const base = JSON.parse(settings.requestBodyJson);
  if (!settings.paginationField || pageIndex === 0) return base;
  const start = Number(settings.paginationStart) || 0;
  base[settings.paginationField] = settings.paginationMode === "offset" ? start + fetchedCount : start + pageIndex;
  return base;
}

async function loadMockResponse() {
  const res = await fetch(chrome.runtime.getURL("fixtures/sample-response.json"));
  const json = await res.json();
  const today = istDateString();
  for (const c of json.data.campaigns) {
    if (typeof c.start_date === "string" && c.start_date.startsWith(FIXTURE_DAY)) {
      c.start_date = today + c.start_date.slice(FIXTURE_DAY.length);
    }
  }
  return { ok: true, json };
}

async function fetchAllCampaigns(settings, state) {
  if (settings.useMockData) return loadMockResponse();

  if (!settings.requestBodyJson) {
    return { ok: false, kind: "setup", detail: "Request body not configured (Settings → Advanced)" };
  }
  try {
    JSON.parse(settings.requestBodyJson);
  } catch {
    return { ok: false, kind: "setup", detail: "Request body is not valid JSON" };
  }

  const opened = await getOrOpenAdsTab(settings, state);
  if (opened.error) return { ok: false, kind: opened.error, detail: opened.detail };
  const tabId = opened.tab.id;
  await setState({ monitorTabId: tabId });

  const fallback = { identifier: state.identifier, ...(await cookieFallback()) };
  let merged = [];
  let firstJson = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await messageTab(tabId, {
      type: "FETCH_CAMPAIGNS",
      body: buildBody(settings, page, merged.length),
      fallback,
    }).catch((err) => ({ ok: false, kind: "network", detail: err?.message || "Tab messaging failed" }));

    if (!res?.ok) {
      if (page === 0) return res || { ok: false, kind: "network", detail: "No response from tab" };
      break; // keep what we already have; never hammer on later pages
    }

    const pageCampaigns = res.json.data.campaigns;
    const ids = new Set(merged.map((c) => c.campaign_id));
    merged = merged.concat(pageCampaigns.filter((c) => !ids.has(c.campaign_id)));
    if (!firstJson) firstJson = res.json;

    if (!settings.paginationField) break;
    if (!needsMorePages(merged, pageCampaigns, firstJson)) break;
  }

  return { ok: true, json: { ...firstJson, data: { ...firstJson.data, campaigns: merged } } };
}

// ---------- check cycle ----------

async function pauseWithError(settings, state, kind, detail) {
  await chrome.alarms.clear(CHECK_ALARM);
  await setState({
    status: "PAUSED_BY_ERROR",
    pauseReason: kind,
    lastError: detail,
    lastErrorAt: Date.now(),
    nextCheckAt: null,
    networkRetryPending: false,
  });
  await sendAlert(
    settings,
    `⛔ ${labelFor(settings, state)}: session expired or blocked (${detail}). Please log in to Meesho manually. Polling stopped — open the extension and click Resume.`,
    "Monitoring paused",
  );
  await updateBadge();
}

async function runCheck({ manual = false } = {}) {
  if (running) return running;
  running = (async () => {
    const settings = await getSettings();
    let state = await getState();

    if (!manual && state.status === "PAUSED_BY_ERROR") return { ok: false, skipped: "paused" };
    if (!manual && !isWithinActiveHours(settings.activeStart, settings.activeEnd)) {
      await scheduleNextCycle(settings);
      return { ok: false, skipped: "outside active hours" };
    }

    await setState({ lastCheckAt: Date.now() });
    const result = await fetchAllCampaigns(settings, state);
    state = await getState();

    if (!result.ok) {
      const { kind, detail } = result;
      if (kind === "session" || kind === "blocked" || kind === "shape") {
        await pauseWithError(settings, state, kind, detail);
        return { ok: false, error: detail, paused: true };
      }
      if (kind === "network" || kind === "http") {
        if (!state.networkRetryPending && !manual) {
          await setState({ networkRetryPending: true, lastError: detail, lastErrorAt: Date.now() });
          await scheduleCheck(NETWORK_RETRY_MIN);
          return { ok: false, error: detail, retrying: true };
        }
        await setState({ networkRetryPending: false, lastError: detail, lastErrorAt: Date.now() });
        await sendAlert(settings, `📡 ${labelFor(settings, state)}: could not reach Meesho (${detail}). Will try again on the normal schedule.`);
        await scheduleNextCycle(settings);
        await updateBadge();
        return { ok: false, error: detail };
      }
      // setup / account problems: no alert spam, just surface in the UI
      await setState({
        status: "NEEDS_SETUP",
        lastError: detail,
        lastErrorAt: Date.now(),
        networkRetryPending: false,
      });
      await scheduleNextCycle(settings);
      await updateBadge();
      return { ok: false, error: detail, needsSetup: true };
    }

    const effectiveSettings = { ...settings, label: labelFor(settings, state) };
    const { alerts, alertedState, summary } = evaluate(result.json, effectiveSettings, await getAlertedState());
    await setAlertedState(alertedState);

    for (const alert of alerts) {
      await sendAlert(settings, alert.text, alert.kind === "daily" ? "Daily limit crossed" : "Ad spend alert");
    }

    const s = summarize(result.json);
    await setState({
      status: "OK",
      pauseReason: null,
      lastSuccessAt: Date.now(),
      lastError: null,
      networkRetryPending: false,
      lastSummary: {
        ...summary,
        mock: Boolean(settings.useMockData),
        live: s.live.map((c) => ({ id: c.id, name: c.name, spent: c.spent, budget: c.budget, orders: c.orders })),
      },
      lastAlerts: alerts.length
        ? [...alerts.map((a) => ({ at: Date.now(), text: a.text })), ...(state.lastAlerts || [])].slice(0, 10)
        : state.lastAlerts,
    });
    await scheduleNextCycle(settings);
    await updateBadge();
    return { ok: true, alerts: alerts.length, summary };
  })();

  try {
    return await running;
  } finally {
    running = null;
  }
}

async function sendHeartbeat() {
  const settings = await getSettings();
  const state = await getState();
  await scheduleHeartbeat(settings);
  const label = labelFor(settings, state);
  const s = state.lastSummary;
  const statusText = state.status === "PAUSED_BY_ERROR" ? " ⛔ PAUSED — needs manual login/resume." : "";
  await sendAlert(
    settings,
    `💚 ${label} alive, last check ${formatIst(state.lastSuccessAt)}, live campaigns ${s?.liveCount ?? 0}, today's spend ₹${formatInr(s?.todayTotal ?? 0)}.${statusText}`,
    "Daily heartbeat",
  );
}

async function updateBadge() {
  const state = await getState();
  const map = {
    OK: { text: "", color: "#15803d" },
    NEEDS_SETUP: { text: "SET", color: "#b45309" },
    PAUSED_BY_ERROR: { text: "!", color: "#b91c1c" },
  };
  const badge = map[state.status] ?? map.OK;
  await chrome.action.setBadgeText({ text: badge.text });
  await chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

// ---------- events ----------

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await resetSchedule();
  await updateBadge();
  if (reason === "install") {
    await chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await resetSchedule();
  await updateBadge();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CHECK_ALARM) runCheck();
  if (alarm.name === HEARTBEAT_ALARM) sendHeartbeat();
});

chrome.notifications.onClicked.addListener(async (id) => {
  chrome.notifications.clear(id);
  try {
    await chrome.action.openPopup();
  } catch {
    chrome.runtime.openOptionsPage();
  }
});

// Backup for account detection: works even when the content script isn't in the tab yet
// (tab opened before install) and catches in-app navigation to the Ads page.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  const identifier = identifierFromUrl(changeInfo.url);
  if (!identifier) return;
  const state = await getState();
  if (state.identifier === identifier && state.monitorTabId === tabId) return;
  await setState({ identifier, monitorTabId: tabId });
  await updateBadge();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handle = async () => {
    switch (msg?.type) {
      case "PAGE_LOADED": {
        const info = msg.info || {};
        const state = await getState();
        const patch = {};
        if (info.identifier && info.isAdsPage) patch.identifier = info.identifier;
        if (info.supplierId) patch.supplierId = info.supplierId;
        if (sender.tab?.id && info.isAdsPage) patch.monitorTabId = sender.tab.id;
        // a user-initiated, logged-in page load clears a session-expired pause (not a block)
        if (state.status === "PAUSED_BY_ERROR" && state.pauseReason === "session" && info.isAdsPage && !info.looksLikeLogin) {
          patch.status = "OK";
          patch.pauseReason = null;
        }
        if (state.status === "NEEDS_SETUP" && info.isAdsPage && !state.identifier) patch.lastError = null;
        if (Object.keys(patch).length) await setState(patch);
        if (patch.status === "OK") await scheduleCheck(2);
        await updateBadge();
        return { ok: true };
      }
      case "CHECK_NOW":
        return runCheck({ manual: true });
      case "RESUME": {
        await setState({ status: "OK", pauseReason: null, lastError: null, networkRetryPending: false });
        await updateBadge();
        return runCheck({ manual: true });
      }
      case "TEST_ALERT": {
        const settings = await getSettings();
        const state = await getState();
        const res = await sendAlert(
          settings,
          `✅ ${labelFor(settings, state)} | Test alert from Meesho Ads Spend Monitor. If you can read this, alerts are working.`,
          "Test alert",
        );
        if (res.desktop || res.telegram === true) await setState({ testAlertSentAt: Date.now() });
        return { ok: true, ...res };
      }
      case "SETTINGS_UPDATED":
        await resetSchedule({ firstRunSoon: false });
        await updateBadge();
        return { ok: true };
      case "OPEN_ADS_PAGE": {
        const state = await getState();
        const url = state.identifier
          ? `https://supplier.meesho.com/panel/v3/new/ads/${encodeURIComponent(state.identifier)}/advertisement`
          : "https://supplier.meesho.com/panel/v3/new/";
        await chrome.tabs.create({ url, active: true });
        return { ok: true };
      }
      default:
        return undefined;
    }
  };
  handle().then(sendResponse, (err) => sendResponse({ ok: false, error: err?.message || String(err) }));
  return true;
});
