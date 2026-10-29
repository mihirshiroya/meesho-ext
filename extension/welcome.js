import { getSettings, saveSettings, getState, setupChecklist } from "./lib/storage.js";
import { detectChats } from "./lib/telegram.js";
import { send, numOrNull, setStatus, withBusy, describeCheckResult } from "./lib/ui.js";

const $ = (id) => document.getElementById(id);

const CHIP_TEXT = {
  account: ["Not detected", "Detected"],
  body: ["Missing", "Saved"],
  limits: ["Not set", "Saved"],
  alerts: ["Not set", "Ready"],
  test: ["Not sent", "Sent"],
  check: ["Not run", "Passed"],
};

let formsFilled = false;

async function render() {
  const settings = await getSettings();
  const state = await getState();
  const items = setupChecklist(settings, state);
  const done = items.filter((i) => i.done).length;

  $("progressText").textContent = `${done} / ${items.length} done`;
  $("progressBar").querySelector("span").style.width = `${(done / items.length) * 100}%`;
  $("progressBar").setAttribute("aria-valuenow", String(done));
  $("progressBar").setAttribute("aria-valuemax", String(items.length));

  for (const item of items) {
    const chip = document.querySelector(`[data-chip="${item.id}"]`);
    if (chip) {
      chip.className = `chip ${item.done ? "ok" : "warn"}`;
      chip.textContent = CHIP_TEXT[item.id][item.done ? 1 : 0];
    }
    const dot = document.querySelector(`[data-check="${item.id}"]`);
    if (dot) {
      dot.classList.toggle("done", item.done);
      if (item.done) dot.textContent = "✓";
    }
  }

  $("accountInfo").textContent = state.identifier
    ? `Detected account: ${state.identifier}${state.supplierId ? ` (supplier ${state.supplierId})` : ""}`
    : "Waiting for you to open the Ads page…";

  if (state.lastSuccessAt && !$("checkStatus").textContent) {
    const s = state.lastSummary || {};
    setStatus($("checkStatus"), `Last check OK. ${s.liveCount ?? 0} live campaign(s), today's spend ₹${(s.todayTotal ?? 0).toLocaleString("en-IN")}.`, "ok");
  }

  if (!formsFilled) {
    formsFilled = true;
    $("bodyInput").value = settings.requestBodyJson;
    $("mockToggle").checked = settings.useMockData;
    const f = $("limitsForm").elements;
    f.label.value = settings.label;
    f.perCampaignLimit.value = settings.perCampaignLimit ?? "";
    f.dailyTotalLimit.value = settings.dailyTotalLimit ?? "";
    f.budgetPctWarnPct.value = settings.budgetPctWarn != null ? Math.round(settings.budgetPctWarn * 100) : "";
    f.wasteSpendThreshold.value = settings.wasteSpendThreshold ?? "";
    $("desktopToggle").checked = settings.desktopNotifications;
    $("tgToken").value = settings.telegramBotToken;
    $("tgChat").value = settings.telegramChatId;
  }
}

$("openAds").addEventListener("click", () => send("OPEN_ADS_PAGE"));

$("saveBody").addEventListener("click", async () => {
  const raw = $("bodyInput").value.trim();
  if (!raw) {
    await saveSettings({ requestBodyJson: "" });
    setStatus($("bodyStatus"), "Cleared.", "");
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("not an object");
    await saveSettings({ requestBodyJson: JSON.stringify(parsed) });
    await send("SETTINGS_UPDATED");
    setStatus($("bodyStatus"), "Saved. The body is valid JSON.", "ok");
  } catch {
    setStatus($("bodyStatus"), "That isn't valid JSON. Copy it from Payload → view source.", "err");
  }
});

$("mockToggle").addEventListener("change", async (e) => {
  await saveSettings({ useMockData: e.target.checked });
  await send("SETTINGS_UPDATED");
});

$("limitsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const pct = numOrNull(f.budgetPctWarnPct.value);
  const patch = {
    label: f.label.value.trim(),
    perCampaignLimit: numOrNull(f.perCampaignLimit.value),
    dailyTotalLimit: numOrNull(f.dailyTotalLimit.value),
    budgetPctWarn: pct === null ? null : Math.min(Math.max(pct, 1), 100) / 100,
    wasteSpendThreshold: numOrNull(f.wasteSpendThreshold.value),
  };
  if (!patch.perCampaignLimit && !patch.dailyTotalLimit) {
    setStatus($("limitsStatus"), "Saved. Tip: set a per-campaign or daily limit to finish this step.", "");
  } else {
    setStatus($("limitsStatus"), "Limits saved.", "ok");
  }
  await saveSettings(patch);
  await send("SETTINGS_UPDATED");
});

$("detectChat").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const token = $("tgToken").value.trim();
    const res = await detectChats(token);
    if (!res.ok) return setStatus($("alertsStatus"), `Telegram: ${res.error}`, "err");
    if (!res.chats.length) {
      return setStatus($("alertsStatus"), "No chats found. Send a message to your bot in Telegram, then try again.", "err");
    }
    const chat = res.chats[res.chats.length - 1];
    $("tgChat").value = chat.id;
    setStatus($("alertsStatus"), `Found “${chat.name}” (${chat.type}). Click Save.`, "ok");
  }),
);

$("saveAlerts").addEventListener("click", async () => {
  await saveSettings({
    desktopNotifications: $("desktopToggle").checked,
    telegramBotToken: $("tgToken").value.trim(),
    telegramChatId: $("tgChat").value.trim(),
  });
  setStatus($("alertsStatus"), "Alert settings saved.", "ok");
});

$("desktopToggle").addEventListener("change", (e) => saveSettings({ desktopNotifications: e.target.checked }));

$("testAlert").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const res = await send("TEST_ALERT");
    const parts = [];
    if (res?.desktop) parts.push("desktop notification shown");
    if (res?.telegram === true) parts.push("Telegram delivered");
    else if (typeof res?.telegram === "string") parts.push(`Telegram failed: ${res.telegram}`);
    const ok = res?.desktop || res?.telegram === true;
    setStatus($("testStatus"), parts.length ? `${parts.join(" · ")}.` : "No channel delivered. Check step 5.", ok ? "ok" : "err");
  }),
);

$("checkNow").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const res = await send("CHECK_NOW");
    const { text, kind } = describeCheckResult(res);
    setStatus($("checkStatus"), text, kind);
  }),
);

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") render();
});

render();
