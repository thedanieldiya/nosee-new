import { publicationRecords, type PublicationRecord } from "./publications";
import { newsRecords, type NewsRecord } from "./news";
import { eventRecords, type EventRecord } from "./events";

// Source strcmp ordering for the ASCII dates/slugs, independent of host locale.
const compare = (left: string, right: string) => left < right ? -1 : Number(left > right);

export function selectFeaturedPublications(records: readonly PublicationRecord[] = publicationRecords, limit = 3) {
  if (limit <= 0) return [];
  return records.filter(record => record.featured === true)
    .sort((a, b) => compare(b.publication_date, a.publication_date) || compare(a.slug, b.slug)).slice(0, limit);
}

export function selectTrendingNews(records: readonly NewsRecord[] = newsRecords, limit = 4) {
  if (limit <= 0) return [];
  return [...records].sort((a, b) => Number(b.featured === true) - Number(a.featured === true)
    || compare(b.published_at, a.published_at) || compare(a.slug, b.slug)).slice(0, limit);
}

export const utcToday = (clock = new Date()) => clock.toISOString().slice(0, 10);

export function selectFeaturedUpcoming(records: readonly EventRecord[] = eventRecords, today = utcToday(), limit = 3) {
  if (limit <= 0) return [];
  return records.filter(record => record.featured === true && (record.end_date ?? record.start_date) >= today)
    .sort((a, b) => compare(a.start_date, b.start_date) || compare(a.slug, b.slug)).slice(0, limit);
}

// Preserve the calendar date carried by the ISO offset, as PHP DateTimeImmutable does.
export const newsDateLabel = (publishedAt: string) => publishedAt.slice(0, 10).split("-").reverse().join("/");
export const newsCategoryLabel = (category: string) => category.replaceAll("-", " ").toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase());

export function eventCardValues(event: EventRecord) {
  const start = event.start_date.split("-").reverse().join(".");
  const end = (event.end_date ?? event.start_date).split("-").reverse().join(".");
  const physical = [event.location.venue, event.location.city, event.location.country].filter(value => value && value !== "0").join(", ");
  return {
    typeLabel: event.type.replaceAll("-", " ").toUpperCase(),
    dateLabel: start === end ? start : `${start} - ${end}`,
    href: event.type === "meeting" ? event.meeting_site_url! : `/events/${event.slug}`,
    locationLabel: event.location.type === "online" ? event.location.platform
      : event.location.type === "hybrid" ? `${physical} + ${event.location.platform ?? ""}` : physical,
  };
}
