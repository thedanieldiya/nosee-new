import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { event, auditLog } from "../admin/schema.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import { descriptionText } from "../research/description.ts";
import { automaticSlug } from "../content/slug.ts";
import { eventRecords } from "../content/events.ts";
import { eventCreateInput, eventUpdateInput, eventPublicationInput, eventDeletionInput, eventQuery, type EventFields, type EventContent } from "./input.ts";
import { publishedEventFields, hasUnpublishedEventChanges, eventDeletionPhrase, eventTiming } from "./content.ts";
export type EventStatus = "draft" | "published" | "unpublished" | "deleted";
export type EventRecord = { id: string; slug: string; fields: EventFields; coverImage: string; coverAlt: string; status: EventStatus; version: number; publishedContent: EventContent | null; updatedAt: string };
const serialize = <T>(v: unknown): T => JSON.parse(JSON.stringify(v));
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ManagementError(result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" ").slice(0, 1500));
  return result.data;
}
async function row(tx: ResearchTransaction, id: string, deleted = false) {
  if (!z.uuid().safeParse(id).success) throw new ManagementError("Event not found.", 404);
  const [record] = await tx.select().from(event).where(eq(event.id, id));
  if (!record || (!deleted && record.status === "deleted")) throw new ManagementError("Event not found.", 404);
  return record;
}
const digest = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
function same(record: { lastMutationKey: string | null; lastMutationDigest: string | null }, key: string | undefined, hash: string) {
  if (!key || record.lastMutationKey !== key) return false;
  if (record.lastMutationDigest !== hash) throw new ManagementError("This request key already saved different changes.", 409);
  return true;
}
function current(record: { version: number }, version: number) {
  if (record.version !== version) throw new ManagementError("This event changed. Reload and review the saved version before retrying.", 409);
}
async function audit(tx: ResearchTransaction, actor: Principal, id: string, action: string, before: string, after: string) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action, targetType: "event", targetId: id, targetLabel: "Event", changes: { before: { status: before }, after: { status: after } }, createdAt: sql`clock_timestamp()` });
}
export function eventSnapshot(fields: EventFields, retained: { slug: string; coverImage: string; coverAlt: string }): EventContent {
  const value = publishedEventFields(fields);
  if (!value.summary || (value.type !== "meeting" && (!value.organiser || !descriptionText(value.body).trim()))) throw new ManagementError("Add a summary, description and organiser before publishing.");
  if (value.type === "meeting" && !value.meetingSiteUrl) throw new ManagementError("Add a meeting-site URL before publishing.");
  if (value.location.type !== "physical" && !value.location.platform) throw new ManagementError("Add an online platform before publishing.");
  if (value.location.type !== "online" && !value.location.venue) throw new ManagementError("Add a venue before publishing.");
  return { ...value, slug: retained.slug, coverImage: retained.coverImage, coverAlt: retained.coverAlt };
}
const live = (content: EventContent) => ({ publishedContent: content, publishedStart: new Date(content.startAt), publishedEnd: new Date(content.endAt), publishedFeatured: content.featured, publishedAt: sql`clock_timestamp()` });
export async function eventsDirectory(actor: Principal, raw: unknown) {
  const q = parse(eventQuery, raw), pattern = `%${q.q.replace(/[\\%_]/g, "\\$&")}%`;
  return authorizedPublishing(actor, async tx => {
    const now = new Date((await tx.execute<{ now: string }>(sql`select clock_timestamp() as now`)).rows[0].now);
    const timing = sql`case when (${event.fields}->>'startAt')::timestamptz > ${now.toISOString()}::timestamptz then 'upcoming' when (${event.fields}->>'endAt')::timestamptz > ${now.toISOString()}::timestamptz then 'ongoing' else 'past' end`;
    const where = sql`${event.deletedAt} is null and (${event.fields}->>'title' ilike ${pattern} or ${event.fields}->>'summary' ilike ${pattern}) and (${q.status}='' or ${event.status}=${q.status}) and (${q.type}='' or ${event.fields}->>'type'=${q.type}) and (${q.timing}='' or ${timing}=${q.timing})`;
    const total = Number((await tx.select({ n: sql`count(*)::int` }).from(event).where(where))[0].n), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(q.page, pages);
    const rows = await tx.select().from(event).where(where).orderBy(desc(event.updatedAt), asc(event.id)).limit(20).offset((page - 1) * 20);
    return { rows: rows.map(r => ({ id: r.id, title: r.fields.title, type: r.fields.type, slug: r.slug, status: r.status, version: r.version, updatedAt: r.updatedAt.toISOString(), timing: eventTiming(r.fields.startAt, r.fields.endAt, now), hasUnpublishedChanges: r.status === "published" && hasUnpublishedEventChanges({ ...r.fields, slug: r.slug, coverImage: r.coverImage, coverAlt: r.coverAlt }, r.publishedContent) })), total, page, pages };
  });
}
export async function getEvent(actor: Principal, id: string) { return authorizedPublishing(actor, async tx => serialize<EventRecord>(await row(tx, id))); }
export async function createEvent(actor: Principal, raw: unknown) {
  const input = parse(eventCreateInput, raw), hash = digest({ fields: input.fields, mode: input.mode });
  return authorizedPublishing(actor, async tx => {
    const [prior] = await tx.select().from(event).where(eq(event.creationKey, input.requestId));
    if (prior) { if (prior.creationDigest !== hash) throw new ManagementError("This creation request already saved different content.", 409); return { id: prior.id, message: "Request already saved." }; }
    const reserved = ["archive", "new", ...eventRecords.map(e => e.slug), ...(await tx.select({ slug: event.slug }).from(event)).map(e => e.slug)];
    const id = randomUUID(), slug = automaticSlug(input.fields.title, reserved, "event"), status = input.mode === "publish" ? "published" : "draft";
    const content = status === "published" ? eventSnapshot(input.fields, { slug, coverImage: "", coverAlt: "" }) : null;
    await tx.insert(event).values({ id, slug, fields: input.fields, status, creationKey: input.requestId, creationDigest: hash, createdBy: actor.id, ...(content ? live(content) : {}) });
    await audit(tx, actor, id, status === "published" ? "Published event" : "Created event draft", "new", status);
    return { id, message: status === "published" ? "Event published." : "Draft saved." };
  });
}
export async function updateEvent(actor: Principal, id: string, raw: unknown) {
  const input = parse(eventUpdateInput, raw), hash = digest(input);
  return authorizedPublishing(actor, async tx => {
    const r = await row(tx, id); if (same(r, input.mutationId, hash)) return { id, message: "Changes already saved." }; current(r, input.version);
    const content = input.mode === "publish" ? eventSnapshot(input.fields, r) : null, status = content ? "published" : r.status;
    await tx.update(event).set({ fields: input.fields, status, ...(content ? live(content) : {}), version: r.version + 1, lastMutationKey: input.mutationId, lastMutationDigest: hash, updatedAt: sql`clock_timestamp()` }).where(eq(event.id, id));
    await audit(tx, actor, id, content ? "Published event changes" : "Saved event working copy", r.status, status);
    return { id, message: content ? "Event published." : r.status === "published" ? "Draft saved. Published content is unchanged." : "Draft saved." };
  });
}
export async function publishEvent(actor: Principal, id: string, raw: unknown) {
  const input = parse(eventPublicationInput, raw), hash = digest(input);
  return authorizedPublishing(actor, async tx => {
    const r = await row(tx, id); if (same(r, input.mutationId, hash)) return { id, slug: r.slug, message: "Publication already saved." }; current(r, input.version);
    if (input.action === "unpublish" && r.status !== "published") throw new ManagementError("Only published events can be unpublished.", 409);
    const content = input.action === "publish" ? eventSnapshot(r.fields, r) : null, status = content ? "published" : "unpublished";
    await tx.update(event).set({ status, ...(content ? live(content) : {}), version: r.version + 1, lastMutationKey: input.mutationId ?? null, lastMutationDigest: input.mutationId ? hash : null, updatedAt: sql`clock_timestamp()` }).where(eq(event.id, id));
    await audit(tx, actor, id, content ? "Published event" : "Unpublished event", r.status, status);
    return { id, slug: r.slug, message: content ? "Event published." : "Event unpublished." };
  });
}
export async function deleteEvent(actor: Principal, id: string, raw: unknown) {
  const input = parse(eventDeletionInput, raw), hash = digest(input);
  return authorizedPublishing(actor, async tx => {
    const r = await row(tx, id, true);
    if (r.status === "deleted" && same(r, input.mutationId, hash)) return { id, slug: r.slug, message: "Event already deleted." };
    if (r.status === "deleted") throw new ManagementError("Event not found.", 404);
    current(r, input.version);
    if (input.phrase !== eventDeletionPhrase(r.fields.title)) throw new ManagementError("Type the exact deletion phrase to confirm.");
    await tx.update(event).set({ status: "deleted", deletedAt: sql`clock_timestamp()`, version: r.version + 1, lastMutationKey: input.mutationId, lastMutationDigest: hash, updatedAt: sql`clock_timestamp()` }).where(eq(event.id, id));
    await audit(tx, actor, id, "Deleted event", r.status, "deleted");
    return { id, slug: r.slug, message: "Event deleted." };
  });
}
