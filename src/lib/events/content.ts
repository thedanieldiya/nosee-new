import { eventFieldsInput, type EventFields, type EventContent } from "./input.ts";
import { canonicalContentFingerprint } from "../news/draft-state.ts";
import { descriptionDocument, validateDescription, type Description } from "../research/description.ts";
export const eventDeletionPhrase = (title: string) => `Delete ${title}`;
export function emptyEventFields(now = new Date()): EventFields {
  const start = new Date(Math.ceil(now.getTime() / 60000) * 60000);
  return { title: "", type: "workshop", summary: "", body: "", organiser: "", speakers: [], featured: false, scheduleMode: "single_day", startAt: start.toISOString(), endAt: new Date(+start + 3600000).toISOString(), timezone: "Africa/Lagos", itinerary: [], deadline: null, location: { type: "physical", venue: "", address: "", city: "", country: "", platform: "" }, registrationUrl: "", meetingSiteUrl: "", resources: [] };
}
export function editableEventFields(value: EventFields): EventFields {
  return Object.fromEntries(Object.keys(emptyEventFields(new Date(0))).map(key => [key, value[key as keyof EventFields]])) as EventFields;
}
export function publishedEventFields(value: EventFields): EventFields {
  const v = eventFieldsInput.parse(editableEventFields(value));
  return { ...v, meetingSiteUrl: v.type === "meeting" ? v.meetingSiteUrl : "", location: { ...v.location,
    ...(v.location.type === "online" ? { venue: "", address: "", city: "", country: "" } : {}),
    ...(v.location.type === "physical" ? { platform: "" } : {}),
  } };
}
export function eventFingerprint(value: EventFields & Partial<Pick<EventContent, "slug" | "coverImage" | "coverAlt">>) {
  let fields = editableEventFields(value);
  try { fields = publishedEventFields(value); } catch { /* Invalid editing state still needs an exit guard. */ }
  let body: Description = descriptionDocument(fields.body);
  try { body = validateDescription(body); } catch { /* Save shows validation. */ }
  return canonicalContentFingerprint({ ...fields, body, slug: value.slug ?? "", coverImage: value.coverImage ?? "", coverAlt: value.coverAlt ?? "" });
}
export const hasUnpublishedEventChanges = (working: EventContent, published: EventContent | null) => !!published && eventFingerprint(working) !== eventFingerprint(published);
export function eventTiming(start: string | Date, end: string | Date, now = new Date()) {
  return +now < +new Date(start) ? "upcoming" : +now < +new Date(end) ? "ongoing" : "past";
}

export function eventDraftFingerprint(value: EventFields) {
  let body: Description = descriptionDocument(value.body);
  try { body = validateDescription(body); } catch { /* Invalid editor content remains dirty. */ }
  return canonicalContentFingerprint({ ...editableEventFields(value), body });
}
