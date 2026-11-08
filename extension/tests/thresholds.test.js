import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluate, normalizeCampaign, needsMorePages, summarize } from "../lib/thresholds.js";
import { istDateString, isWithinActiveHours, nextIstTime } from "../lib/time.js";
import { DEFAULT_SETTINGS, exportableSettings, mergeImportedSettings } from "../lib/storage.js";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/sample-response.json", import.meta.url)));
const NOW = new Date("2026-10-25T14:00:00+05:30");
const clone = () => structuredClone(fixture);
const settings = (patch = {}) => ({ ...DEFAULT_SETTINGS, label: "Shop B", ...patch });

test("normalizeCampaign treats missing order_count as 0", () => {
  const c = normalizeCampaign(fixture.data.campaigns[0]);
  assert.equal(c.orders, 0);
  assert.equal(c.spent, 240);
  assert.equal(c.status, "LIVE");
});

test("summary: today total counts paused-today campaigns, not yesterday", () => {
  const s = summarize(fixture, NOW);
  assert.equal(s.liveCount, 2);
  assert.equal(s.todayTotal, 240 + 120 + 50);
});

test("budget % and waste rules fire for the zero-order LIVE campaign", () => {
  const { alerts } = evaluate(fixture, settings(), null, NOW);
  const a = alerts.find((x) => x.campaignId === "27630001");
  assert.ok(a);
  assert.deepEqual(a.rules.sort(), ["budgetPct", "waste"]);
  assert.match(a.text, /Shop B \| "Ad_I 25 Oct 2026 \| 09:12" spent ₹240 of ₹300 \(80%\), 0 orders/);
  assert.match(a.text, /Today total: ₹410/);
  assert.ok(!alerts.find((x) => x.campaignId === "27630002"), "healthy campaign does not alert");
});

test("paused campaigns never trigger per-campaign rules", () => {
  const { alerts } = evaluate(fixture, settings({ perCampaignLimit: 10 }), null, NOW);
  assert.ok(!alerts.some((a) => a.campaignId === "27626237" || a.campaignId === "27630003"));
});

test("per-campaign limit", () => {
  const { alerts } = evaluate(fixture, settings({ perCampaignLimit: 100, budgetPctWarn: null, wasteSpendThreshold: null }), null, NOW);
  assert.equal(alerts.filter((a) => a.rules.includes("perCampaign")).length, 2);
});

test("daily total limit", () => {
  const { alerts } = evaluate(fixture, settings({ dailyTotalLimit: 400 }), null, NOW);
  const daily = alerts.find((a) => a.kind === "daily");
  assert.ok(daily);
  assert.match(daily.text, /₹410/);
});

test("min ROI rule respects the spend floor", () => {
  const s = settings({ minRoi: 20, roiSpendFloor: 100, budgetPctWarn: null, wasteSpendThreshold: null });
  const { alerts } = evaluate(fixture, s, null, NOW);
  assert.deepEqual(alerts.map((a) => a.campaignId).sort(), ["27630001", "27630002"]);
  const { alerts: none } = evaluate(fixture, { ...s, roiSpendFloor: 500 }, null, NOW);
  assert.equal(none.length, 0);
});

test("dedup: same spend does not re-alert; +step does", () => {
  const first = evaluate(fixture, settings(), null, NOW);
  const second = evaluate(fixture, settings(), first.alertedState, NOW);
  assert.equal(second.alerts.length, 0);

  const bumped = clone();
  bumped.data.campaigns[0].perf_details.budget_utilised = 289;
  const third = evaluate(bumped, settings(), first.alertedState, NOW);
  assert.equal(third.alerts.length, 0, "below +₹50 step");

  bumped.data.campaigns[0].perf_details.budget_utilised = 290;
  const fourth = evaluate(bumped, settings(), first.alertedState, NOW);
  assert.equal(fourth.alerts.length, 1);
});

test("dedup state resets on a new IST day", () => {
  const first = evaluate(fixture, settings(), null, NOW);
  const nextDay = clone();
  for (const c of nextDay.data.campaigns) {
    if (c.status === "LIVE") c.start_date = "2026-10-26T09:00:00+05:30";
  }
  const later = evaluate(nextDay, settings(), first.alertedState, new Date("2026-10-26T10:00:00+05:30"));
  assert.equal(later.alertedState.day, "2026-10-26");
  assert.ok(later.alerts.length > 0);
});

test("midnight rollover: IST date, not UTC", () => {
  assert.equal(istDateString(new Date("2026-10-24T19:00:00Z")), "2026-10-25");
  assert.equal(istDateString(new Date("2026-10-24T18:00:00Z")), "2026-10-24");
});

test("early exit when nothing is live and nothing started today", () => {
  const json = { data: { status_wise_details: [{ status: "LIVE", count: 0 }], campaigns: [fixture.data.campaigns[2]] } };
  const res = evaluate(json, settings({ perCampaignLimit: 1, dailyTotalLimit: 1 }), null, NOW);
  assert.equal(res.summary.skipped, true);
  assert.equal(res.alerts.length, 0);
});

test("needsMorePages only when LIVE or today's campaigns may be missing", () => {
  const json = clone();
  json.data.total_campaigns_count = 62;
  const page = json.data.campaigns.slice(0, 1);
  assert.equal(needsMorePages(page, page, json, NOW), true, "only 1 of 2 LIVE seen");
  const old = [fixture.data.campaigns[0], fixture.data.campaigns[1], fixture.data.campaigns[2]];
  assert.equal(needsMorePages(old, old, json, NOW), false, "all LIVE seen and last is from yesterday");
});

test("active hours and heartbeat scheduling in IST", () => {
  assert.equal(isWithinActiveHours("08:00", "23:00", new Date("2026-10-25T07:30:00+05:30")), false);
  assert.equal(isWithinActiveHours("08:00", "23:00", new Date("2026-10-25T12:00:00+05:30")), true);
  assert.equal(isWithinActiveHours("22:00", "02:00", new Date("2026-10-25T01:00:00+05:30")), true);
  const when = nextIstTime("21:00", new Date("2026-10-25T22:00:00+05:30"));
  assert.equal(new Date(when).toISOString(), "2026-10-26T15:30:00.000Z");
});

const quiet = { budgetPctWarn: null, wasteSpendThreshold: null };

test("campaign-wise limit overrides the shop default for that campaign only", () => {
  const s = settings({
    ...quiet,
    perCampaignLimit: 1000,
    campaignOverrides: { "27630002": { spendLimit: 100 } },
  });
  const { alerts } = evaluate(fixture, s, null, NOW);
  assert.deepEqual(alerts.map((a) => a.campaignId), ["27630002"]);
  assert.match(alerts[0].text, /limit ₹100 \(campaign\)/);
});

test("auto-stop off: no stops even over the limit", () => {
  const { stops } = evaluate(fixture, settings({ ...quiet, perCampaignLimit: 100 }), null, NOW);
  assert.equal(stops.length, 0);
});

test("auto-stop with no expected ROI stops at the spend limit (hard cap)", () => {
  const { stops } = evaluate(fixture, settings({ ...quiet, perCampaignLimit: 200, autoStopEnabled: true }), null, NOW);
  assert.deepEqual(stops.map((x) => [x.campaignId, x.reason]), [["27630001", "spendLimit"]]);
});

test("auto-stop with expected ROI: low ROI stops, good ROI keeps running", () => {
  const s = settings({ ...quiet, perCampaignLimit: 100, minRoi: 10, autoStopEnabled: true });
  const { stops } = evaluate(fixture, s, null, NOW);
  // 27630001: ROI 0 < 10 → stop. 27630002: ROI 15.75 ≥ 10 → keep running.
  assert.deepEqual(stops.map((x) => [x.campaignId, x.reason]), [["27630001", "lowRoi"]]);

  const worse = clone();
  worse.data.campaigns[1].perf_details.roi = 8;
  const later = evaluate(worse, s, null, NOW);
  assert.ok(later.stops.some((x) => x.campaignId === "27630002"), "re-checked and stopped once ROI drops");
});

test("per-campaign expected ROI and autoStop override", () => {
  const s = settings({
    ...quiet,
    perCampaignLimit: 100,
    minRoi: 10,
    autoStopEnabled: true,
    campaignOverrides: {
      "27630001": { autoStop: "off" },
      "27630002": { expectedRoi: 20 },
    },
  });
  const { stops } = evaluate(fixture, s, null, NOW);
  assert.deepEqual(stops.map((x) => x.campaignId), ["27630002"]);
  assert.equal(stops[0].expectedRoi, 20);
});

test("auto-stop can be enabled for one campaign while the shop default is off", () => {
  const s = settings({ ...quiet, campaignOverrides: { "27630001": { spendLimit: 200, autoStop: "on" } } });
  const { stops } = evaluate(fixture, s, null, NOW);
  assert.deepEqual(stops.map((x) => x.campaignId), ["27630001"]);
});

test("already-stopped campaigns are not stopped twice the same day", () => {
  const s = settings({ ...quiet, perCampaignLimit: 200, autoStopEnabled: true });
  const first = evaluate(fixture, s, null, NOW);
  first.alertedState.stopped["27630001"] = Date.now();
  const second = evaluate(fixture, s, first.alertedState, NOW);
  assert.equal(second.stops.length, 0);
});

test("daily total auto-stop skips good-ROI campaigns", () => {
  const s = settings({ ...quiet, dailyTotalLimit: 400, minRoi: 10, autoStopOnDailyTotal: true });
  const { stops } = evaluate(fixture, s, null, NOW);
  assert.deepEqual(stops.map((x) => [x.campaignId, x.reason]), [["27630001", "dailyTotal"]]);
});

test("export excludes the Telegram token; import keeps profile-only fields", () => {
  const exported = exportableSettings(settings({ telegramBotToken: "secret", perCampaignLimit: 200 }));
  assert.ok(!("telegramBotToken" in exported.settings));
  const current = settings({ label: "Shop C", telegramBotToken: "mine", startOffsetMin: 14 });
  const merged = mergeImportedSettings(current, exported);
  assert.equal(merged.label, "Shop C");
  assert.equal(merged.telegramBotToken, "mine");
  assert.equal(merged.startOffsetMin, 14);
  assert.equal(merged.perCampaignLimit, 200);
});
