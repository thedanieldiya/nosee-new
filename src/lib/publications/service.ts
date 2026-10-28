import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { publication, publicationDoi, researchGroup, auditLog } from "../admin/schema.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import { automaticSlug } from "../content/slug.ts";
import { publicationRecords } from "../content/publications.ts";
import { publicationCreateInput, publicationUpdateInput, publicationStateInput, publicationDeletionInput, publicationQuery, type PublicationFields, type PublicationContent } from "./input.ts";
import { editablePublicationFields, hasUnpublishedPublicationChanges, publicationDeletionPhrase, publicationDateKey, publicationRequirements } from "./content.ts";
export type PublicationStatus = "draft" | "published" | "unpublished" | "deleted";
export type PublicationRecord = { id: string; slug: string; fields: PublicationFields; status: PublicationStatus; version: number; publishedContent: PublicationContent | null; selectedGroup: {id:string;name:string} | null; updatedAt: string };
const serialize = <T>(v: unknown): T => JSON.parse(JSON.stringify(v));
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ManagementError(result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" ").slice(0, 1500));
  return result.data;
}
async function row(tx: ResearchTransaction, id: string, deleted = false) {
  if (!z.uuid().safeParse(id).success) throw new ManagementError("Publication not found.", 404);
  const [record] = await tx.select().from(publication).where(eq(publication.id, id));
  if (!record || (!deleted && record.status === "deleted")) throw new ManagementError("Publication not found.", 404);
  return record;
}
const digest = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");
function same(record: { lastMutationKey: string | null; lastMutationDigest: string | null }, key: string | undefined, hash: string) {
  if (!key || record.lastMutationKey !== key) return false;
  if (record.lastMutationDigest !== hash) throw new ManagementError("This request key already saved different changes.", 409);
  return true;
}
function current(record: { version: number }, version: number) {
  if (record.version !== version) throw new ManagementError("This publication changed. Reload and review the saved version before retrying.", 409);
}
async function audit(tx: ResearchTransaction, actor: Principal, id: string, action: string, before: string, after: string) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action, targetType: "publication", targetId: id, targetLabel: "Publication", changes: { before: { status: before }, after: { status: after } }, createdAt: sql`clock_timestamp()` });
}
export async function publicationSnapshot(tx: ResearchTransaction, fields: PublicationFields, slug: string): Promise<PublicationContent> {
  const errors = publicationRequirements(fields);
  if (Object.keys(errors).length) throw new ManagementError(Object.values(errors).join(" "));
  const group = await eligibleGroup(tx,fields.groupId);
  const publishedGroup = group?.status === "published" && group.publishedContent && group.publishedSlug ? { name: group.publishedContent.name, slug: group.publishedSlug } : null;
  return { ...editablePublicationFields(fields), slug, publicGroup: publishedGroup };
}
async function eligibleGroup(tx: ResearchTransaction, id: string | null) {
  if (!id) return null;
  const [group] = await tx.select({ id: researchGroup.id, status: researchGroup.status, publishedContent: researchGroup.publishedContent, publishedSlug: researchGroup.publishedSlug }).from(researchGroup).where(sql`${researchGroup.id}=${id}::uuid and ${researchGroup.deletedAt} is null`);
  if (!group) throw new ManagementError("The selected research group is no longer available. Choose another group or clear the association.",409);
  return group;
}
export async function checkDoi(tx: ResearchTransaction, doi: string, id?: string) {
  if (!doi) return;
  const [prior] = await tx.select({ id: publication.id, status: publication.status }).from(publicationDoi).innerJoin(publication,eq(publication.id,publicationDoi.publicationId)).where(eq(publicationDoi.doi,doi));
  if (prior && prior.id !== id) {
    const error = new ManagementError(prior.status === "deleted" ? "This DOI is reserved by a deleted publication and cannot be reused." : "This DOI already belongs to an existing publication. Open it to review the record.",409);
    error.conflict = { ...(prior.status !== "deleted" ? {existingId:prior.id} : {}), deleted:prior.status === "deleted" }; throw error;
  }
}
async function reserveDoi(tx: ResearchTransaction, doi: string, id: string) {
  if (doi) await tx.insert(publicationDoi).values({doi,publicationId:id}).onConflictDoNothing();
}
const live = (content: PublicationContent) => ({publishedContent:content,publishedDateKey:publicationDateKey(content.publicationDate),publishedAt:sql`clock_timestamp()`});
export async function publicationsDirectory(actor: Principal,raw: unknown) {
  const q = parse(publicationQuery,raw), pattern = `%${q.q.replace(/[\\%_]/g,"\\$&")}%`;
  return authorizedPublishing(actor, async tx => {
    const where = sql`${publication.deletedAt} is null and (${publication.fields}->>'title' ilike ${pattern} or ${publication.fields}->>'authors' ilike ${pattern} or ${publication.fields}->>'doi' ilike ${pattern}) and (${q.status}='' or ${publication.status}=${q.status}) and (${q.type}='' or ${publication.fields}->>'type'=${q.type}) and (${q.area}='' or ${publication.fields}->'researchAreas' ? ${q.area})`;
    const total=Number((await tx.select({n:sql`count(*)::int`}).from(publication).where(where))[0].n),pages=Math.max(1,Math.ceil(total/20)),page=Math.min(q.page,pages);
    const rows=await tx.select().from(publication).where(where).orderBy(desc(publication.updatedAt),asc(publication.id)).limit(20).offset((page-1)*20);
    return {rows:rows.map(r=>({id:r.id,title:r.fields.title,doi:r.fields.doi,type:r.fields.type,slug:r.slug,status:r.status,version:r.version,updatedAt:r.updatedAt.toISOString(),hasUnpublishedChanges:r.status === "published" && hasUnpublishedPublicationChanges(r.fields,r.publishedContent)})),total,pages,page};
  });
}
export async function publicationGroups(actor: Principal, q: string) {
  if (q.length>120) throw new ManagementError("Use a shorter group search.");
  const pattern=`%${q.replace(/[\\%_]/g,"\\$&")}%`;
  return authorizedPublishing(actor,async tx=>({rows:await tx.select({id:researchGroup.id,name:researchGroup.name}).from(researchGroup).where(sql`${researchGroup.deletedAt} is null and ${researchGroup.name} ilike ${pattern}`).orderBy(asc(researchGroup.name),asc(researchGroup.id)).limit(20)}));
}
export async function getPublication(actor: Principal, id: string) { return authorizedPublishing(actor, async tx => { const r=await row(tx,id);const [group]=r.fields.groupId?await tx.select({id:researchGroup.id,name:researchGroup.name}).from(researchGroup).where(sql`${researchGroup.id}=${r.fields.groupId}::uuid and ${researchGroup.deletedAt} is null`):[];return serialize<PublicationRecord>({...r,selectedGroup:group??null}); }); }
export async function createPublication(actor: Principal, raw: unknown) {
  const input = parse(publicationCreateInput, raw), hash = digest({ fields: input.fields, mode: input.mode });
  return authorizedPublishing(actor, async tx => {
    const [prior] = await tx.select().from(publication).where(eq(publication.creationKey, input.requestId));
    if (prior) { if (prior.creationDigest !== hash) throw new ManagementError("This creation request already saved different content.", 409); return { id: prior.id, message: "Request already saved." }; }
    await eligibleGroup(tx,input.fields.groupId);
    await checkDoi(tx,input.fields.doi);
    const reserved = ["new", ...publicationRecords.map(e => e.slug), ...(await tx.select({ slug: publication.slug }).from(publication)).map(e => e.slug)];
    const id = randomUUID(), slug = automaticSlug(input.fields.title, reserved, "publication"), status = input.mode === "publish" ? "published" : "draft";
    const content = status === "published" ? await publicationSnapshot(tx,input.fields,slug) : null;
    await tx.insert(publication).values({ id, slug, doi: input.fields.doi || null, fields: input.fields, status, creationKey: input.requestId, creationDigest: hash, createdBy: actor.id, ...(content ? live(content) : {}) });
    await reserveDoi(tx,input.fields.doi,id);
    await audit(tx, actor, id, status === "published" ? "Published publication" : "Created publication draft", "new", status);
    return { id, message: status === "published" ? "Publication published." : "Draft saved." };
  });
}
export async function updatePublication(actor: Principal, id: string, raw: unknown) {
  const input = parse(publicationUpdateInput, raw), hash = digest(input);
  return authorizedPublishing(actor, async tx => {
    const r = await row(tx, id); if (same(r, input.mutationId, hash)) return { id, message: "Changes already saved." }; current(r, input.version);
    await eligibleGroup(tx,input.fields.groupId); await checkDoi(tx,input.fields.doi,id);
    const content = input.mode === "publish" ? await publicationSnapshot(tx,input.fields,r.slug) : null, status = content ? "published" : r.status;
    await tx.update(publication).set({ doi:input.fields.doi || null, fields: input.fields, status, ...(content ? live(content) : {}), version: r.version + 1, lastMutationKey: input.mutationId, lastMutationDigest: hash, updatedAt: sql`clock_timestamp()` }).where(eq(publication.id, id));
    await reserveDoi(tx,input.fields.doi,id);
    await audit(tx, actor, id, content ? "Published publication changes" : "Saved publication working copy", r.status, status);
    return { id, message: content ? "Publication published." : r.status === "published" ? "Draft saved. Published content is unchanged." : "Draft saved." };
  });
}
export async function publishPublication(actor: Principal, id: string, raw: unknown) {
  const input = parse(publicationStateInput, raw), hash = digest(input);
  return authorizedPublishing(actor, async tx => {
    const r = await row(tx, id); if (same(r, input.mutationId, hash)) return { id, slug: r.slug, message: "Publication already saved." }; current(r, input.version);
    if (input.action === "unpublish" && r.status !== "published") throw new ManagementError("Only published publications can be unpublished.", 409);
    const content = input.action === "publish" ? await publicationSnapshot(tx,r.fields,r.slug) : null, status = content ? "published" : "unpublished";
    await tx.update(publication).set({ status, ...(content ? live(content) : {}), version: r.version + 1, lastMutationKey: input.mutationId ?? null, lastMutationDigest: input.mutationId ? hash : null, updatedAt: sql`clock_timestamp()` }).where(eq(publication.id, id));
    await audit(tx, actor, id, content ? "Published publication" : "Unpublished publication", r.status, status);
    return { id, slug: r.slug, message: content ? "Publication published." : "Publication unpublished." };
  });
}
export async function deletePublication(actor: Principal, id: string, raw: unknown) {
  const input = parse(publicationDeletionInput, raw), hash = digest(input);
  return authorizedPublishing(actor, async tx => {
    const r = await row(tx, id, true);
    if (r.status === "deleted" && same(r, input.mutationId, hash)) return { id, slug: r.slug, message: "Publication already deleted." };
    if (r.status === "deleted") throw new ManagementError("Publication not found.", 404);
    current(r, input.version);
    if (input.phrase !== publicationDeletionPhrase(r.fields.title)) throw new ManagementError("Type the exact deletion phrase to confirm.");
    await tx.update(publication).set({ status: "deleted", deletedAt: sql`clock_timestamp()`, version: r.version + 1, lastMutationKey: input.mutationId, lastMutationDigest: hash, updatedAt: sql`clock_timestamp()` }).where(eq(publication.id, id));
    await audit(tx, actor, id, "Deleted publication", r.status, "deleted");
    return { id, slug: r.slug, message: "Publication deleted." };
  });
}
