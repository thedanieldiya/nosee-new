import type { EventContent } from "./input.ts";
import type { EventRecord } from "../content/events.ts";
import { editorialLocal } from "../timezones.ts";
export function toPublicEvent(content: EventContent): EventRecord {
  const start = editorialLocal(content.startAt, content.timezone), end = editorialLocal(content.endAt, content.timezone);
  return { slug: content.slug, title: content.title, type: content.type, summary: content.summary, featured: content.featured, body: content.body,
    image: content.coverImage || null, image_alt: content.coverAlt || null, timezone: content.timezone,
    start_at: content.startAt, end_at: content.endAt, start_date: start.date, end_date: end.date === start.date ? null : end.date,
    schedule: { mode: content.scheduleMode, start_time: start.time.slice(0, 5), end_time: end.time.slice(0, 5), itinerary: content.itinerary.map(entry => {
      const at = editorialLocal(entry.at, content.timezone), stop = entry.endAt ? editorialLocal(entry.endAt, content.timezone) : null;
      return { date: at.date, ...(stop && stop.date !== at.date ? { end_date: stop.date } : {}), start_time: at.time.slice(0, 5), end_time: stop?.time.slice(0, 5) ?? null, title: entry.title || null, description: entry.description || null };
    }) }, location: content.location, application_deadline: content.deadline, meeting_site_url: content.meetingSiteUrl || null,
    organiser: content.organiser, speakers: content.speakers, registration_url: content.registrationUrl || null, resources: content.resources };
}
export function eventZoneLabel(zone: string, instant: string) {
  const name = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(new Date(instant)).find(p => p.type === "timeZoneName")?.value?.replace("GMT", "UTC");
  return zone === "Africa/Lagos" ? "WAT (UTC+01:00)" : `${zone} (${name})`;
}

export function eventScheduleZoneLabel(zone: string, start: string, end: string) {
  const a = eventZoneLabel(zone, start), b = eventZoneLabel(zone, end);
  return a === b ? a : `${a} → ${b}`;
}
