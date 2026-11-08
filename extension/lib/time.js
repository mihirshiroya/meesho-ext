export const IST_TZ = "Asia/Kolkata";
// IST has no daylight saving, so a fixed offset is safe for computing future instants.
const IST_OFFSET_MS = 330 * 60 * 1000;

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const displayFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST_TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

/** "YYYY-MM-DD" for the given instant in IST. */
export function istDateString(date = new Date()) {
  return dateFmt.format(date);
}

/** Minutes since IST midnight for the given instant. */
export function istMinutesOfDay(date = new Date()) {
  const parts = timeFmt.formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Parses "HH:MM" into minutes; returns null when invalid. */
export function parseHHMM(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** True when `date` falls inside [start, end] IST. Supports windows that cross midnight. */
export function isWithinActiveHours(start, end, date = new Date()) {
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  if (s == null || e == null) return true;
  const now = istMinutesOfDay(date);
  if (s === e) return true;
  return s < e ? now >= s && now <= e : now >= s || now <= e;
}

/** Epoch ms of the next occurrence of HH:MM IST strictly after `from`. */
export function nextIstTime(hhmm, from = new Date()) {
  const minutes = parseHHMM(hhmm);
  if (minutes == null) return null;
  const istNow = new Date(from.getTime() + IST_OFFSET_MS);
  const target = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) + minutes * 60000;
  let when = target - IST_OFFSET_MS;
  if (when <= from.getTime()) when += 24 * 60 * 60 * 1000;
  return when;
}

/** Epoch ms of the next IST active-hours start after `from`. */
export function nextActiveStart(start, from = new Date()) {
  return nextIstTime(start, from);
}

export function formatIst(value) {
  if (!value) return "—";
  const d = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return displayFmt.format(d);
}
