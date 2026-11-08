import { getSettings, getState, setupChecklist } from "./lib/storage.js";
import { formatIst } from "./lib/time.js";
import { send, setStatus, withBusy, describeCheckResult, STATUS_META } from "./lib/ui.js";

const $ = (id) => document.getElementById(id);

async function render() {
  const settings = await getSettings();
  const state = await getState();
  const meta = STATUS_META[state.status] ?? STATUS_META.OK;

  $("label").textContent = settings.label || "Meesho Ads Monitor";
  $("account").textContent = state.identifier ? `Account ${state.identifier}${settings.useMockData ? " · demo data" : ""}` : "Account not detected yet";
  $("statusChip").className = `chip ${meta.chip}`;
  $("statusChip").textContent = meta.label;

  const s = state.lastSummary;
  $("liveCount").textContent = s ? String(s.liveCount ?? 0) : "—";
  $("todayTotal").textContent = s ? `₹${(s.todayTotal ?? 0).toLocaleString("en-IN")}` : "—";
  $("lastSuccess").textContent = formatIst(state.lastSuccessAt);
  $("nextCheck").textContent = state.status === "PAUSED_BY_ERROR" ? "Stopped" : formatIst(state.nextCheckAt);

  const errorBox = $("errorBox");
  if (state.lastError) {
    errorBox.hidden = false;
    errorBox.textContent =
      state.status === "PAUSED_BY_ERROR"
        ? `${state.lastError}. Log in to Meesho in this profile, then click Resume.`
        : state.lastError;
  } else {
    errorBox.hidden = true;
  }
  $("resume").hidden = state.status !== "PAUSED_BY_ERROR";

  const items = setupChecklist(settings, state);
  const pending = items.filter((i) => !i.done);
  $("setupBox").hidden = pending.length === 0;
  $("setupList").replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      const tick = document.createElement("span");
      tick.className = `tick${item.done ? " done" : ""}`;
      tick.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = item.label;
      if (!item.done) text.style.fontWeight = "600";
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = item.done ? " (done)" : " (to do)";
      li.append(tick, text, sr);
      return li;
    }),
  );

  const live = s?.live ?? [];
  $("campaignsBox").hidden = live.length === 0;
  $("autoStopChip").className = `chip ${settings.autoStopEnabled ? "ok" : ""}`.trim();
  $("autoStopChip").textContent = settings.autoStopEnabled ? "Auto-stop on" : "Auto-stop off";
  $("campaignsList").replaceChildren(
    ...live.map((c) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = c.name;
      name.title = c.name;
      const detail = document.createElement("span");
      const over = c.spendLimit && c.spent >= c.spendLimit;
      const roiLow = c.expectedRoi !== null && c.expectedRoi !== undefined && (c.roi ?? 0) < c.expectedRoi;
      const limitText = c.spendLimit ? ` / ₹${c.spendLimit.toLocaleString("en-IN")}` : "";
      const roiText = c.expectedRoi !== null && c.expectedRoi !== undefined ? `ROI ${c.roi ?? "—"} vs ${c.expectedRoi}` : `ROI ${c.roi ?? "—"}`;
      const tag = c.stopped ? " · STOPPED" : over && c.autoStop && roiLow ? " · stopping" : over ? " · over limit" : "";
      detail.textContent = `₹${(c.spent ?? 0).toLocaleString("en-IN")}${limitText} · ${roiText}${tag}`;
      if (c.stopped || over) detail.className = "over";
      li.append(name, detail);
      return li;
    }),
  );

  const alerts = state.lastAlerts || [];
  $("alertsBox").hidden = alerts.length === 0;
  $("alertsList").replaceChildren(
    ...alerts.slice(0, 5).map((a) => {
      const p = document.createElement("p");
      p.textContent = `${formatIst(a.at)} · ${a.text}`;
      return p;
    }),
  );
}

$("checkNow").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const res = await send("CHECK_NOW");
    const { text, kind } = describeCheckResult(res);
    setStatus($("checkStatus"), text, kind);
  }),
);

$("resume").addEventListener("click", (e) =>
  withBusy(e.currentTarget, async () => {
    const res = await send("RESUME");
    const { text, kind } = describeCheckResult(res);
    setStatus($("checkStatus"), text, kind);
  }),
);

chrome.storage.onChanged.addListener((_c, area) => area === "local" && render());
render();
