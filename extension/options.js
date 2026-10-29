import { getSettings, saveSettings, getState, exportableSettings, mergeImportedSettings } from "./lib/storage.js";
import { detectChats } from "./lib/telegram.js";
import { formatIst, parseHHMM } from "./lib/time.js";
import { send, numOrNull, setStatus, withBusy, describeCheckResult, STATUS_META } from "./lib/ui.js";

const $ = (id) => document.getElementById(id);
const form = $("form");
const NUMBER_FIELDS = [
  "perCampaignLimit", "dailyTotalLimit", "wasteSpendThreshold", "reAlertStepInr", "minRoi",
  "roiSpendFloor", "intervalMinMin", "intervalMaxMin", "startOffsetMin", "paginationStart",
];
const TEXT_FIELDS = ["label", "telegramBotToken", "telegramChatId", "paginationField", "paginationMode", "activeStart", "activeEnd", "heartbeatTime"];
const BOOL_FIELDS = ["autoOpenTab", "desktopNotifications", "useMockData"];

function fillForm(settings) {
  const f = form.elements;
  for (const k of NUMBER_FIELDS) f[k].value = settings[k] ?? "";
  for (const k of TEXT_FIELDS) f[k].value = settings[k] ?? "";
  for (const k of BOOL_FIELDS) f[k].checked = Boolean(settings[k]);
  f.budgetPctWarnPct.value = settings.budgetPctWarn != null ? Math.round(settings.budgetPctWarn * 100) : "";
  f.requestBodyJson.value = settings.requestBodyJson ? JSON.stringify(JSON.parse(settings.requestBodyJson), null, 2) : "";
}

function readForm() {
  const f = form.elements;
  const out = {};
  for (const k of NUMBER_FIELDS) out[k] = numOrNull(f[k].value);
  for (const k of TEXT_FIELDS) out[k] = f[k].value.trim();
  for (const k of BOOL_FIELDS) out[k] = f[k].checked;
  const pct = numOrNull(f.budgetPctWarnPct.value);
  out.budgetPctWarn = pct === null ? null : Math.min(Math.max(pct, 1), 100) / 100;

  const errors = [];
  const body = f.requestBodyJson.value.trim();
  if (body) {
    try {
      out.requestBodyJson = JSON.stringify(JSON.parse(body));
    } catch {
      errors.push("Request body isn't valid JSON");
    }
  } else {
    out.requestBodyJson = "";
  }
  out.intervalMinMin = Math.max(10, out.intervalMinMin ?? 15);
  out.intervalMaxMin = Math.max(out.intervalMinMin, out.intervalMaxMin ?? 25);
  out.startOffsetMin = Math.max(0, out.startOffsetMin ?? 0);
  out.reAlertStepInr = out.reAlertStepInr ?? 0;
  out.roiSpendFloor = out.roiSpendFloor ?? 0;
  for (const k of ["activeStart", "activeEnd"]) {
    if (parseHHMM(out[k]) === null) errors.push(`${k === "activeStart" ? "Active from" : "Active until"} must be a time`);
  }
  return { values: out, errors };
}

async function renderStatus() {
  const state = await getState();
  const meta = STATUS_META[state.status] ?? STATUS_META.OK;
  $("statusChip").className = `chip ${meta.chip}`;
  $("statusChip").textContent = meta.label;
  $("stAccount").textContent = state.identifier || "Not detected";
  $("stSuccess").textContent = formatIst(state.lastSuccessAt);
  $("stNext").textContent = state.status === "PAUSED_BY_ERROR" ? "Stopped" : formatIst(state.nextCheckAt);
  $("stError").textContent = state.lastError || "None";
  $("resume").hidden = state.status !== "PAUSED_BY_ERROR";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { values, errors } = readForm();
  if (errors.length) return setStatus($("saveStatus"), errors.join(". "), "err");
  await saveSettings(values);
  await send("SETTINGS_UPDATED");
  fillForm(await getSettings());
  setStatus($("saveStatus"), "Saved. The schedule has been updated.", "ok");
});

$("checkNow").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const { text, kind } = describeCheckResult(await send("CHECK_NOW"));
    setStatus($("actionStatus"), text, kind);
  }),
);

$("resume").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const { text, kind } = describeCheckResult(await send("RESUME"));
    setStatus($("actionStatus"), text, kind);
  }),
);

$("testAlert").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const res = await send("TEST_ALERT");
    const parts = [];
    if (res?.desktop) parts.push("desktop shown");
    if (res?.telegram === true) parts.push("Telegram delivered");
    else if (typeof res?.telegram === "string") parts.push(`Telegram failed: ${res.telegram}`);
    setStatus($("actionStatus"), parts.join(" · ") || "Nothing delivered. Save your notification settings first.", res?.desktop || res?.telegram === true ? "ok" : "err");
  }),
);

$("detectChat").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const res = await detectChats(form.elements.telegramBotToken.value.trim());
    if (!res.ok) return setStatus($("saveStatus"), `Telegram: ${res.error}`, "err");
    if (!res.chats.length) return setStatus($("saveStatus"), "No chats found. Message your bot first, then try again.", "err");
    form.elements.telegramChatId.value = res.chats[res.chats.length - 1].id;
    setStatus($("saveStatus"), "Chat ID filled in. Click Save settings.", "ok");
  }),
);

$("exportBtn").addEventListener("click", async () => {
  const data = exportableSettings(await getSettings());
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "meesho-ads-monitor-settings.json" });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus($("ioStatus"), "Exported (Telegram token not included).", "ok");
});

$("importFile").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    const merged = mergeImportedSettings(await getSettings(), imported);
    await saveSettings(merged);
    await send("SETTINGS_UPDATED");
    fillForm(await getSettings());
    setStatus($("ioStatus"), "Imported. Check the label and start offset for this profile.", "ok");
  } catch {
    setStatus($("ioStatus"), "That file isn't a valid settings export.", "err");
  }
  e.target.value = "";
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.state) renderStatus();
});

fillForm(await getSettings());
renderStatus();
