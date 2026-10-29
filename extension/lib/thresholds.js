import { istDateString } from "./time.js";

export const RULE_LABELS = {
  perCampaign: "Per-campaign limit",
  budgetPct: "Budget % used",
  waste: "Spend with 0 orders",
  roi: "Low ROI",
  dailyTotal: "Daily total limit",
};

export function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isSet(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

const round2 = (n) => Math.round(n * 100) / 100;

export function formatInr(n) {
  return num(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function normalizeCampaign(raw) {
  const perf = raw?.perf_details ?? {};
  return {
    id: String(raw?.campaign_id ?? ""),
    name: raw?.campaign_name || `Campaign ${raw?.campaign_id ?? "?"}`,
    status: String(raw?.status ?? "").toUpperCase(),
    startDate: raw?.start_date ?? null,
    budget: num(raw?.total_budget),
    spent: num(perf.budget_utilised),
    orders: num(perf.order_count),
    roi: perf.roi === undefined || perf.roi === null ? null : num(perf.roi),
  };
}

export function statusCount(data, status) {
  const entry = (data?.status_wise_details ?? []).find((s) => String(s?.status).toUpperCase() === status);
  return entry ? num(entry.count) : null;
}

export function startedToday(campaign, today) {
  if (!campaign.startDate) return false;
  const d = new Date(campaign.startDate);
  if (Number.isNaN(d.getTime())) return false;
  return istDateString(d) === today;
}

/** Summary numbers used by the popup, heartbeat and early-exit rule. */
export function summarize(json, now = new Date()) {
  const today = istDateString(now);
  const data = json?.data ?? {};
  const campaigns = (data.campaigns ?? []).map(normalizeCampaign);
  const live = campaigns.filter((c) => c.status === "LIVE");
  const todays = campaigns.filter((c) => startedToday(c, today));
  const liveFromStatus = statusCount(data, "LIVE");
  return {
    today,
    campaigns,
    live,
    todays,
    liveCount: liveFromStatus ?? live.length,
    todayTotal: round2(todays.reduce((s, c) => s + c.spent, 0)),
    totalCampaigns: num(data.total_campaigns_count) || campaigns.length,
  };
}

function freshAlertedState(alertedState, today) {
  if (alertedState && alertedState.day === today) {
    return { day: today, keys: { ...(alertedState.keys ?? {}) } };
  }
  return { day: today, keys: {} };
}

export function formatCampaignAlert(label, c, rules, todayTotal) {
  const pct = c.budget > 0 ? ` (${Math.round((c.spent / c.budget) * 100)}%)` : "";
  const orders = `${c.orders} order${c.orders === 1 ? "" : "s"}`;
  const roi = rules.includes("roi") && c.roi !== null ? `, ROI ${c.roi}` : "";
  const ruleText = rules.map((r) => RULE_LABELS[r] ?? r).join(", ");
  return `⚠️ ${label} | "${c.name}" spent ₹${formatInr(c.spent)} of ₹${formatInr(c.budget)}${pct}, ${orders}${roi}. Rule: ${ruleText}. Today total: ₹${formatInr(todayTotal)}.`;
}

export function formatDailyAlert(label, todayTotal, limit, todayCount) {
  return `🚨 ${label} | Today's ad spend ₹${formatInr(todayTotal)} crossed your daily limit of ₹${formatInr(limit)} (${todayCount} campaign${todayCount === 1 ? "" : "s"} started today).`;
}

/**
 * Pure evaluation of a campaign-list response against settings.
 * Returns alerts to send plus the next dedup state; never mutates inputs.
 */
export function evaluate(json, settings, alertedState, now = new Date()) {
  const s = summarize(json, now);
  const label = settings?.label || "Meesho";
  const nextState = freshAlertedState(alertedState, s.today);
  const summary = {
    liveCount: s.liveCount,
    todayTotal: s.todayTotal,
    todayCount: s.todays.length,
    totalCampaigns: s.totalCampaigns,
    skipped: false,
  };

  if (s.liveCount === 0 && s.live.length === 0 && s.todays.length === 0) {
    return { alerts: [], alertedState: nextState, summary: { ...summary, skipped: true } };
  }

  const step = num(settings?.reAlertStepInr);
  const shouldAlert = (key, value) => {
    const prev = nextState.keys[key];
    if (prev === undefined) return true;
    return step > 0 && value >= prev + step;
  };

  const alerts = [];
  for (const c of s.live) {
    const triggered = [];
    if (isSet(settings?.perCampaignLimit) && num(settings.perCampaignLimit) > 0 && c.spent >= num(settings.perCampaignLimit)) {
      triggered.push("perCampaign");
    }
    if (isSet(settings?.budgetPctWarn) && num(settings.budgetPctWarn) > 0 && c.budget > 0 && c.spent >= num(settings.budgetPctWarn) * c.budget) {
      triggered.push("budgetPct");
    }
    if (isSet(settings?.wasteSpendThreshold) && num(settings.wasteSpendThreshold) > 0 && c.spent >= num(settings.wasteSpendThreshold) && c.orders === 0) {
      triggered.push("waste");
    }
    if (isSet(settings?.minRoi) && c.roi !== null && c.spent >= num(settings?.roiSpendFloor) && c.roi < num(settings.minRoi)) {
      triggered.push("roi");
    }

    const fresh = triggered.filter((rule) => shouldAlert(`${c.id}:${rule}`, c.spent));
    if (fresh.length === 0) continue;
    for (const rule of fresh) nextState.keys[`${c.id}:${rule}`] = c.spent;
    alerts.push({
      kind: "campaign",
      campaignId: c.id,
      rules: fresh,
      spent: c.spent,
      text: formatCampaignAlert(label, c, fresh, s.todayTotal),
    });
  }

  const dailyLimit = num(settings?.dailyTotalLimit);
  if (isSet(settings?.dailyTotalLimit) && dailyLimit > 0 && s.todayTotal >= dailyLimit) {
    const key = `${s.today}:dailyTotal`;
    if (shouldAlert(key, s.todayTotal)) {
      nextState.keys[key] = s.todayTotal;
      alerts.push({
        kind: "daily",
        rules: ["dailyTotal"],
        spent: s.todayTotal,
        text: formatDailyAlert(label, s.todayTotal, dailyLimit, s.todays.length),
      });
    }
  }

  return { alerts, alertedState: nextState, summary };
}

/**
 * Decides whether another page is needed to cover LIVE and today's campaigns.
 * Assumes the API returns campaigns newest-first (as observed).
 */
export function needsMorePages(merged, lastPage, json, now = new Date()) {
  const data = json?.data ?? {};
  const total = num(data.total_campaigns_count);
  if (!lastPage || lastPage.length === 0) return false;
  if (total && merged.length >= total) return false;
  const today = istDateString(now);
  const liveExpected = statusCount(data, "LIVE") ?? 0;
  const liveSeen = merged.filter((c) => String(c?.status).toUpperCase() === "LIVE").length;
  if (liveSeen < liveExpected) return true;
  const last = normalizeCampaign(lastPage[lastPage.length - 1]);
  return startedToday(last, today);
}
