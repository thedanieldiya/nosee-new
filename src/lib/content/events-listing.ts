import { eventRecords, type EventRecord } from "./events";

export const eventTypes: Record<string, { tag_classes: string; duration_classes: string }> = {
  meeting: { tag_classes: "bg-brand/10 text-brand", duration_classes: "bg-brand text-inverse" },
  conference: { tag_classes: "bg-purple-100 text-purple-800", duration_classes: "bg-surface text-primary" },
  workshop: { tag_classes: "bg-orange-100 text-orange-800", duration_classes: "bg-surface text-primary" },
  lecture: { tag_classes: "bg-blue-100 text-blue-800", duration_classes: "bg-surface text-primary" },
  training: { tag_classes: "bg-sky-100 text-sky-800", duration_classes: "bg-surface text-primary" },
  outreach: { tag_classes: "bg-rose-100 text-rose-800", duration_classes: "bg-surface text-primary" },
};

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const calendarDate = (date: string) => ({ year: date.slice(0, 4), month: months[Number(date.slice(5, 7)) - 1], day: Number(date.slice(8, 10)) });
const shortMonth = (date: string) => calendarDate(date).month.slice(0, 3).toUpperCase();
const fullDate = (date: string) => { const d = calendarDate(date); return `${d.month} ${d.day}, ${d.year}`; };
const dateParts = (date: string) => ({ day: date.slice(8, 10), month: shortMonth(date) });

function localParts(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const p = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

// Resolve local wall time using IANA offsets, including PHP's forward normalization
// of nonexistent spring-transition times. Never use the server/browser timezone.
function localInstant(date: string, time: string, timezone: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  let instant = wall;
  let previous = NaN;
  for (let i = 0; i < 4; i++) {
    const offset = Date.parse(localParts(new Date(instant), timezone) + "Z") - instant;
    const next = wall - offset;
    if (next === instant) return instant;
    if (next === previous) return Math.max(next, instant);
    previous = instant;
    instant = next;
  }
  return instant;
}

export function eventState(event: EventRecord, now: Date): "upcoming" | "ongoing" | "past" {
  if (event.type === "meeting" || event.schedule.mode === "multi_day") {
    const today = localParts(now, event.timezone).slice(0, 10);
    return today < event.start_date ? "upcoming" : today > (event.end_date ?? event.start_date) ? "past" : "ongoing";
  }
  const start = localInstant(event.start_date, event.schedule.start_time!, event.timezone);
  // End-of-day is immediately before the next local midnight, not UTC midnight.
  const nextDay = new Date(Date.parse(event.start_date + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  const end = event.schedule.end_time === null ? localInstant(nextDay, "00:00", event.timezone) - 1 : localInstant(event.start_date, event.schedule.end_time, event.timezone);
  return now.getTime() < start ? "upcoming" : now.getTime() > end ? "past" : "ongoing";
}

function formatTime(time: string | null) {
  if (time === null) return null;
  const hour = Number(time.slice(0, 2));
  return `${hour % 12 || 12}:${time.slice(3, 5)} ${hour < 12 ? "AM" : "PM"}`;
}

function dateRange(event: EventRecord) {
  const start = calendarDate(event.start_date), endDate = event.end_date ?? event.start_date, end = calendarDate(endDate);
  if (event.start_date === endDate) return fullDate(event.start_date);
  if (event.start_date.slice(0, 7) === endDate.slice(0, 7)) return `${start.month} ${start.day}–${end.day}, ${end.year}`;
  if (start.year === end.year) return `${start.month} ${start.day} – ${fullDate(endDate)}`;
  return `${fullDate(event.start_date)} – ${fullDate(endDate)}`;
}

export function presentEvent(event: EventRecord, now: Date, includePastDeadline = false) {
  const state = eventState(event, now), external = event.type === "meeting";
  const physical = [event.location.venue, event.location.address, event.location.city, event.location.country].filter(v => typeof v === "string" && v !== "").join(", ");
  let deadline = null;
  if (event.application_deadline !== null && (state !== "past" || includePastDeadline)) {
    const instant = new Date(event.application_deadline);
    const local = localParts(instant, event.timezone);
    deadline = instant > now ? `${fullDate(local.slice(0, 10))} at ${formatTime(local.slice(11, 16))}` : "Applications closed";
  }
  return {
    ...event, state, destination: external ? event.meeting_site_url! : `/events/${event.slug}`, external,
    presentation: {
      start_time: formatTime(event.schedule.start_time), end_time: formatTime(event.schedule.end_time),
      date_range: dateRange(event), start_date: dateParts(event.start_date), end_date: dateParts(event.end_date ?? event.start_date),
      location: event.location.type === "online" ? event.location.platform : event.location.type === "hybrid" ? `${physical} + ${event.location.platform}` : physical,
      application_deadline: deadline,
      itinerary: event.schedule.itinerary.map(day => ({ ...day, presentation: {
        date: `${new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(day.date + "T12:00:00Z"))}, ${fullDate(day.date)}`,
        start_time: formatTime(day.start_time), end_time: formatTime(day.end_time),
      } })),
      type: eventTypes[event.type],
    },
  };
}

export type PresentedEvent = ReturnType<typeof presentEvent>;
export type EventDay = { date: string; label: string; events: PresentedEvent[] };
type EventMonth = { key: string; label: string; days: EventDay[] };

const compareString = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const sortKey = (event: EventRecord) => `${event.start_date} ${event.type !== "meeting" && event.schedule.mode === "single_day" ? event.schedule.start_time : "00:00"}`;
const compare = (a: EventRecord, b: EventRecord) => compareString(sortKey(a), sortKey(b)) || compareString(a.slug, b.slug);
// PHP trim/stripos use ASCII whitespace/case; Unicode normalization would change search.
export const normalizeEventQuery = (query: unknown): string | null => typeof query === "string" ? query.replace(/^[\x00\x09-\x0b\x0d ]+|[\x00\x09-\x0b\x0d ]+$/g, "") || null : null;
const lower = (value: string) => value.replace(/[A-Z]/g, c => c.toLowerCase());
function matchesQuery(event: EventRecord, query: string) {
  const l = event.location;
  return [event.title, event.summary, event.type, l.venue, l.address, l.city, l.country, l.platform, event.organiser].some(v => typeof v === "string" && lower(v).includes(lower(query)));
}

function groupByStartMonth(events: PresentedEvent[]) {
  const groups: EventMonth[] = [];
  for (const event of events) {
    const key = event.start_date.slice(0, 7), d = calendarDate(event.start_date);
    let month = groups.find(m => m.key === key);
    if (!month) { month = { key, label: `${d.month} ${d.year}`, days: [] }; groups.push(month); }
    let day = month.days.find(d => d.date === event.start_date);
    if (!day) { day = { date: event.start_date, label: `${event.start_date.slice(8, 10)} ${shortMonth(event.start_date)}`, events: [] }; month.days.push(day); }
    day.events.push(event);
  }
  return groups;
}

export function buildEvents(query: unknown = null, now = new Date(), records: readonly EventRecord[] = eventRecords) {
  const normalized = normalizeEventQuery(query);
  const presented = records.map(event => presentEvent(event, now));
  const ongoing = presented.filter(e => e.state === "ongoing").sort(compare);
  let upcoming = presented.filter(e => e.state === "upcoming").sort(compare);
  const featured = upcoming.find(e => e.featured === true && e.type === "meeting") ?? upcoming[0] ?? null;
  if (normalized !== null) upcoming = upcoming.filter(e => matchesQuery(e, normalized));
  return { featured, ongoing, upcoming, upcoming_groups: groupByStartMonth(upcoming), query: normalized };
}

export function archiveEvents(now = new Date(), records: readonly EventRecord[] = eventRecords) {
  const past = records.map(e => presentEvent(e, now)).filter(e => e.state === "past").sort((a, b) => compare(b, a));
  const years: { year: string; months: EventMonth[] }[] = [];
  for (const month of groupByStartMonth(past)) {
    const year = month.key.slice(0, 4);
    let group = years.find(y => y.year === year);
    if (!group) { group = { year, months: [] }; years.push(group); }
    group.months.push({ ...month, label: calendarDate(month.days[0].date).month });
  }
  return years;
}
