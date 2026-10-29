export function send(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

export function numOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function setStatus(el, text, kind = "") {
  if (!el) return;
  el.textContent = text;
  el.className = `status-line ${kind}`.trim();
}

export async function withBusy(button, fn) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Working…";
  try {
    return await fn();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

export function describeCheckResult(res) {
  if (!res) return { text: "No response from the extension.", kind: "err" };
  if (res.ok) {
    const s = res.summary || {};
    const base = s.skipped
      ? "Check OK. No live campaigns and none started today, so there was nothing to evaluate."
      : `Check OK. ${s.liveCount ?? 0} live campaign(s), today's spend ₹${(s.todayTotal ?? 0).toLocaleString("en-IN")}.`;
    return { text: `${base} ${res.alerts ? `${res.alerts} alert(s) sent.` : "No limits crossed."}`, kind: "ok" };
  }
  if (res.retrying) return { text: `Network problem (${res.error}). Will retry in 5 minutes.`, kind: "err" };
  if (res.paused) return { text: `Paused: ${res.error}. Log in to Meesho, then click Resume.`, kind: "err" };
  return { text: res.error || "Check failed.", kind: "err" };
}

export const STATUS_META = {
  OK: { label: "Healthy", chip: "ok" },
  NEEDS_SETUP: { label: "Setup needed", chip: "warn" },
  PAUSED_BY_ERROR: { label: "Paused", chip: "danger" },
};
