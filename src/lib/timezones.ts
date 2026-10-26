// Database timestamps are UTC instants; dashboard/editor labels default to Lagos civil time.
export const DASHBOARD_TIME_ZONE = "Africa/Lagos";
const supported = new Set(["Africa/Lagos", "UTC", "Africa/Accra", "Europe/London", "America/New_York"]);
export function editorialZone(value: string | undefined | null) { return value && supported.has(value) ? value : DASHBOARD_TIME_ZONE; }
const formatters = new Map<string, Intl.DateTimeFormat>();
function parts(instant: Date | string | number, zone: string) {
  const timeZone = editorialZone(zone);
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    formatters.set(timeZone, formatter);
  }
  const value = new Date(instant);
  if (!Number.isFinite(value.getTime())) throw new RangeError("Invalid date.");
  const fields = Object.fromEntries(formatter.formatToParts(value).filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return { year: Number(fields.year), month: Number(fields.month), day: Number(fields.day), hour: Number(fields.hour), minute: Number(fields.minute), second: Number(fields.second) };
}
export function editorialLocal(instant: Date | string, zone = DASHBOARD_TIME_ZONE) {
  const p = parts(instant, zone);
  return { date: [p.year, String(p.month).padStart(2, "0"), String(p.day).padStart(2, "0")].join("-"), time: [p.hour, p.minute, p.second].map(x => String(x).padStart(2, "0")).join(":") };
}
function offsetAt(timestamp: number, zone: string) {
  const p = parts(timestamp, zone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - timestamp;
}
// Resolve supported IANA civil times, including DST transitions, without assuming the browser's zone.
// For an ambiguous autumn hour, choose the earlier occurrence; nonexistent spring-forward times fail.
export function editorialInstant(date: string, time: string, zone = DASHBOARD_TIME_ZONE) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match || !t) throw new RangeError("Enter a valid publication date and time.");
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const hour = Number(t[1]), minute = Number(t[2]), second = Number(t[3] ?? 0);
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  if (year < 1970 || year > 9998 || new Date(guess).toISOString().slice(0, 10) !== date || hour > 23 || minute > 59 || second > 59) throw new RangeError("Enter a valid publication date and time.");
  const wanted = { date, time: [hour, minute, second].map(x => String(x).padStart(2, "0")).join(":") };
  const candidates = new Set<number>();
  for (const sample of [guess - 86400000, guess, guess + 86400000]) {
    const candidate = guess - offsetAt(sample, zone);
    const local = editorialLocal(new Date(candidate), zone);
    if (local.date === wanted.date && local.time === wanted.time) candidates.add(candidate);
  }
  if (!candidates.size) throw new RangeError("This local time does not exist in the chosen time zone. Choose another time.");
  return new Date(Math.min(...candidates)).toISOString();
}
export function dashboardDateTime(value: Date | string | null | undefined) {
  if (!value) return "Not recorded";
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: DASHBOARD_TIME_ZONE }).format(instant) + " WAT" : "Not recorded";
}
export function newsEditorialDate(value: Date | string, zone = DASHBOARD_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: editorialZone(zone) }).format(new Date(value));
}
export function newsShortDate(value: Date | string, zone = DASHBOARD_TIME_ZONE) {
  const date = editorialLocal(value, zone).date;
  return date.split("-").reverse().join("/");
}
