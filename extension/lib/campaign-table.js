import { numOrNull } from "./ui.js";
import { formatInr } from "./thresholds.js";

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Campaigns from the last check, plus any saved override that is no longer LIVE. */
export function campaignRows(settings, state) {
  const overrides = settings.campaignOverrides ?? {};
  const live = state.lastSummary?.live ?? [];
  const rows = live.map((c) => ({ ...c, live: true }));
  const seen = new Set(rows.map((r) => r.id));
  for (const [id, ov] of Object.entries(overrides)) {
    if (!seen.has(id)) rows.push({ id, name: ov?.name || `Campaign ${id}`, live: false });
  }
  return rows;
}

function ruleSummary(row, settings) {
  const ov = settings.campaignOverrides?.[row.id] ?? {};
  const limit = ov.spendLimit ?? settings.perCampaignLimit;
  const roi = ov.expectedRoi ?? settings.minRoi;
  const autoStop = ov.autoStop === "on" ? true : ov.autoStop === "off" ? false : Boolean(settings.autoStopEnabled);
  if (row.stopped) return "Stopped by monitor today";
  if (!limit) return "No spend limit, alerts only";
  if (!autoStop) return `Alert at ₹${formatInr(limit)}`;
  if (roi === null || roi === undefined || roi === "") return `Stop at ₹${formatInr(limit)}`;
  return `At ₹${formatInr(limit)}+: stop while ROI < ${roi}`;
}

export function renderCampaignTable(container, settings, state) {
  const rows = campaignRows(settings, state);
  if (rows.length === 0) {
    container.replaceChildren(
      el("p", { className: "small muted", textContent: "No campaigns yet. Click “Check now” once so the monitor can load your LIVE campaigns, then set limits for each one here." }),
    );
    return;
  }

  const overrides = settings.campaignOverrides ?? {};
  const globalLimit = settings.perCampaignLimit ? `₹${settings.perCampaignLimit} (shop)` : "Off";
  const globalRoi = settings.minRoi !== null && settings.minRoi !== undefined && settings.minRoi !== "" ? `${settings.minRoi} (shop)` : "Off";
  const globalStop = settings.autoStopEnabled ? "Shop default (on)" : "Shop default (off)";

  const tbody = el("tbody");
  for (const row of rows) {
    const ov = overrides[row.id] ?? {};
    const spend = el("input", {
      type: "number", min: "0", step: "1", placeholder: globalLimit,
      value: ov.spendLimit ?? "",
    });
    spend.dataset.id = row.id;
    spend.dataset.field = "spendLimit";
    spend.setAttribute("aria-label", `Spend limit for ${row.name}`);

    const roi = el("input", {
      type: "number", min: "0", step: "0.1", placeholder: globalRoi,
      value: ov.expectedRoi ?? "",
    });
    roi.dataset.id = row.id;
    roi.dataset.field = "expectedRoi";
    roi.setAttribute("aria-label", `Expected ROI for ${row.name}`);

    const stop = el("select", {}, [
      el("option", { value: "default", textContent: globalStop }),
      el("option", { value: "on", textContent: "Auto-stop on" }),
      el("option", { value: "off", textContent: "Never stop (alert only)" }),
    ]);
    stop.value = ov.autoStop === "on" || ov.autoStop === "off" ? ov.autoStop : "default";
    stop.dataset.id = row.id;
    stop.dataset.field = "autoStop";
    stop.dataset.name = row.name;
    stop.setAttribute("aria-label", `Auto-stop for ${row.name}`);

    const stats = row.live
      ? `₹${formatInr(row.spent)} of ₹${formatInr(row.budget)} · ${row.orders ?? 0} orders · ROI ${row.roi ?? "—"}`
      : "Not LIVE in the last check";

    tbody.append(
      el("tr", {}, [
        el("td", {}, [
          el("strong", { textContent: row.name }),
          el("div", { className: "small muted", textContent: `#${row.id} · ${stats}` }),
          el("div", { className: `small ${row.stopped ? "status-line err" : "muted"}`, textContent: ruleSummary(row, settings) }),
        ]),
        el("td", {}, spend),
        el("td", {}, roi),
        el("td", {}, stop),
      ]),
    );
  }

  const table = el("table", { className: "simple campaign-table" }, [
    el("thead", {}, el("tr", {}, [
      el("th", { scope: "col", textContent: "Campaign" }),
      el("th", { scope: "col", textContent: "Spend limit (₹)" }),
      el("th", { scope: "col", textContent: "Expected ROI" }),
      el("th", { scope: "col", textContent: "Auto-stop" }),
    ])),
    tbody,
  ]);
  container.replaceChildren(el("div", { className: "table-scroll" }, table));
}

/** Reads the table back into a campaignOverrides object; empty rows are dropped. */
export function readCampaignTable(container, previous = {}) {
  const next = {};
  const byId = {};
  for (const input of container.querySelectorAll("[data-id][data-field]")) {
    const id = input.dataset.id;
    byId[id] ??= { name: previous[id]?.name };
    if (input.dataset.name) byId[id].name = input.dataset.name;
    if (input.dataset.field === "autoStop") byId[id].autoStop = input.value;
    else byId[id][input.dataset.field] = numOrNull(input.value);
  }
  for (const [id, ov] of Object.entries(byId)) {
    const hasValue = ov.spendLimit !== null || ov.expectedRoi !== null || ov.autoStop === "on" || ov.autoStop === "off";
    if (!hasValue) continue;
    next[id] = {
      name: ov.name || `Campaign ${id}`,
      spendLimit: ov.spendLimit !== null && ov.spendLimit > 0 ? ov.spendLimit : null,
      expectedRoi: ov.expectedRoi,
      autoStop: ov.autoStop || "default",
    };
  }
  return next;
}
