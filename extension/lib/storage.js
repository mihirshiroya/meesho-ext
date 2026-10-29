export const DEFAULT_SETTINGS = {
  label: "",
  perCampaignLimit: null,
  budgetPctWarn: 0.8,
  dailyTotalLimit: null,
  wasteSpendThreshold: 50,
  minRoi: null,
  roiSpendFloor: 100,
  reAlertStepInr: 50,
  intervalMinMin: 15,
  intervalMaxMin: 25,
  startOffsetMin: 0,
  activeStart: "08:00",
  activeEnd: "23:00",
  autoOpenTab: true,
  telegramBotToken: "",
  telegramChatId: "",
  desktopNotifications: true,
  heartbeatTime: "21:00",
  requestBodyJson: "",
  paginationField: "",
  paginationMode: "page",
  paginationStart: 1,
  useMockData: false,
};

export const DEFAULT_STATE = {
  status: "NEEDS_SETUP",
  pauseReason: null,
  identifier: null,
  supplierId: null,
  monitorTabId: null,
  lastCheckAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastError: null,
  nextCheckAt: null,
  networkRetryPending: false,
  lastSummary: null,
  lastAlerts: [],
  testAlertSentAt: null,
  onboardingDismissed: false,
};

/** Settings that belong to one profile and must survive an import. */
const PROFILE_ONLY_KEYS = ["label", "startOffsetMin", "telegramBotToken"];

export async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}

export async function getState() {
  const { state } = await chrome.storage.local.get("state");
  return { ...DEFAULT_STATE, ...(state ?? {}) };
}

export async function setState(patch) {
  const current = await getState();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ state: next });
  return next;
}

export async function getAlertedState() {
  const { alertedState } = await chrome.storage.local.get("alertedState");
  return alertedState ?? null;
}

export async function setAlertedState(alertedState) {
  await chrome.storage.local.set({ alertedState });
}

export function exportableSettings(settings) {
  const copy = { ...settings };
  delete copy.telegramBotToken;
  return { exportedAt: new Date().toISOString(), version: 1, settings: copy };
}

export function mergeImportedSettings(current, imported) {
  const incoming = imported?.settings ?? imported ?? {};
  const next = { ...current };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (PROFILE_ONLY_KEYS.includes(key)) continue;
    if (key in incoming) next[key] = incoming[key];
  }
  return next;
}

/** Shared setup checklist used by the popup, options and welcome guide. */
export function setupChecklist(settings, state) {
  const telegramReady = Boolean(settings.telegramBotToken && settings.telegramChatId);
  return [
    { id: "account", label: "Meesho account detected", done: Boolean(state.identifier) },
    { id: "body", label: "Request body pasted", done: Boolean(settings.requestBodyJson) || settings.useMockData },
    { id: "limits", label: "Spend limits set", done: Boolean(settings.perCampaignLimit || settings.dailyTotalLimit) },
    { id: "alerts", label: telegramReady ? "Telegram connected" : "Alerts configured", done: telegramReady || settings.desktopNotifications },
    { id: "test", label: "Test alert sent", done: Boolean(state.testAlertSentAt) },
    { id: "check", label: "First successful check", done: Boolean(state.lastSuccessAt) },
  ];
}
