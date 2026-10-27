import { z } from "zod";
import { newsBody, editorialZones } from "../news/input.ts";
import { editorialLocal } from "../timezones.ts";
const text = (max: number) => z.string().trim().max(max).refine(v => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v), "Use printable text.");
export const eventTypes = ["meeting", "conference", "workshop", "lecture", "training", "outreach"] as const;
export function safeEventUrl(value: string) {
  if (!value) return true;
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) && !url.username && !url.password && !/[\s\\]/.test(value); } catch { return false; }
}
const url = text(2048).refine(safeEventUrl, "Use an HTTP(S) URL without credentials.");
const instant = z.iso.datetime({ offset: true }).refine(v => Date.parse(v) >= 0 && Date.parse(v) < Date.UTC(9999, 0, 1), "Use a date from 1970 through 9998.").transform(v => new Date(v).toISOString());
export const eventFieldsInput = z.object({
  title: text(160).min(1, "Add a title."), type: z.enum(eventTypes), summary: text(400), body: newsBody,
  organiser: text(160), speakers: z.array(text(160).min(1)).max(30), featured: z.boolean(),
  scheduleMode: z.enum(["single_day", "multi_day"]), startAt: instant, endAt: instant, timezone: z.enum(editorialZones),
  itinerary: z.array(z.object({ at: instant, endAt: instant.nullable(), title: text(160), description: text(600) }).strict()).max(40),
  deadline: instant.nullable(),
  location: z.object({ type: z.enum(["physical", "online", "hybrid"]), venue: text(160), address: text(240), city: text(120), country: text(120), platform: text(160) }).strict(),
  registrationUrl: url, meetingSiteUrl: url, resources: z.array(z.object({ label: text(120).min(1), url: url.refine(v => !!v, "Add a URL.") }).strict()).max(30),
}).strict().superRefine((v, ctx) => {
  const start = Date.parse(v.startAt), end = Date.parse(v.endAt);
  // Zod can still run object refinements after a failed datetime format check.
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < 0 || start >= Date.UTC(9999, 0, 1) || end >= Date.UTC(9999, 0, 1)) return;
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
  if (end <= start) issue(["endAt"], "End must be after start.");
  const a = editorialLocal(v.startAt, v.timezone).date, b = editorialLocal(v.endAt, v.timezone).date;
  const next = new Date(Date.parse(a + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  if (v.scheduleMode === "single_day" && b !== a && b !== next) issue(["scheduleMode"], "Use multi-day for a schedule longer than overnight.");
  if (v.scheduleMode === "multi_day" && b <= a) issue(["endAt"], "A multi-day event must end on a later local date.");
  if (v.deadline && Date.parse(v.deadline) > end) issue(["deadline"], "Deadline cannot be after the event ends.");
  v.itinerary.forEach((entry, i) => {
    const at = Date.parse(entry.at), stop = entry.endAt ? Date.parse(entry.endAt) : at;
    if (at < start || at >= end || stop > end || stop < at || (entry.endAt && stop === at)) issue(["itinerary", i], "Itinerary times must lie within the event, with end after start.");
  });
});
export type EventFields = z.infer<typeof eventFieldsInput>;
export type EventContent = EventFields & { slug: string; coverImage: string; coverAlt: string };
export const eventCreateInput = z.object({ fields: eventFieldsInput, mode: z.enum(["draft", "publish"]).default("draft"), requestId: z.uuid(), confirm: z.literal(true) }).strict();
export const eventUpdateInput = z.object({ fields: eventFieldsInput, mode: z.enum(["draft", "publish"]).default("draft"), version: z.number().int().positive(), mutationId: z.uuid(), confirm: z.literal(true) }).strict();
export const eventPublicationInput = z.object({ action: z.enum(["publish", "unpublish"]), version: z.number().int().positive(), mutationId: z.uuid(), confirm: z.literal(true) }).strict();
export const eventDeletionInput = z.object({ phrase: z.string().max(180), version: z.number().int().positive(), mutationId: z.uuid(), confirm: z.literal(true) }).strict();
export const eventQuery = z.object({ q: text(120).default(""), status: z.enum(["", "draft", "published", "unpublished"]).default(""), type: z.enum(["", ...eventTypes]).default(""), timing: z.enum(["", "upcoming", "ongoing", "past"]).default(""), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
