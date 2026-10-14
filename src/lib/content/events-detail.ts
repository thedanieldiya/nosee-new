import { eventRecords, type EventRecord } from "./events";

export function findEvent(slug: string): EventRecord | null {
  return eventRecords.find(event => event.slug === slug) ?? null;
}
