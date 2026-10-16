import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { ManagementError } from "../admin/errors.ts";
import { user, member, auditLog, researchGroup, researchGroupMember, researchLeadAssignment, invitation, session } from "../admin/schema.ts";
import type { Principal } from "../admin/policy.ts";
import { descriptionText } from "./description.ts";
import { automaticSlug } from "../content/slug.ts";
import { researchDeletionPhrase } from "./slug.ts";
import type { GroupContent, EligibleMember } from "./options.ts";
import { groupContentInput, groupDeletionInput, groupCreateInput, groupUpdateInput, groupQuery, eligibleQuery, groupMemberInput, leadInput, leadInvitationInput, publicationInput } from "./input.ts";
import { requireResearchTransaction, eligibleMember, researchAudit, revokeLeadAssignments, type ResearchTransaction } from "./security.ts";
export type GroupRecord = GroupContent & { id: string; version: number; status: "draft" | "published"; publishedContent: GroupContent | null; publishedSlug: string | null; publishedAt: string | null; updatedAt: string };
const contentProjection = { name: researchGroup.name, slug: researchGroup.slug, introduction: researchGroup.introduction, description: sql<GroupContent["description"]>`coalesce(${researchGroup.descriptionDocument},to_jsonb(${researchGroup.description}))`, objectives: researchGroup.objectives, coverImage: researchGroup.coverImage, coverAlt: sql<string>`${researchGroup.name} || ' cover photo'` };
const projection = { ...contentProjection, id: researchGroup.id, version: researchGroup.version, status: researchGroup.status, publishedContent: researchGroup.publishedContent, publishedSlug: researchGroup.publishedSlug, publishedAt: researchGroup.publishedAt, updatedAt: researchGroup.updatedAt };
const memberProjection = { id: member.id, firstName: member.firstName, lastName: member.lastName, affiliation: member.affiliation, version: member.version };
const serialize = <T>(value: unknown) => JSON.parse(JSON.stringify(value)) as T;
const pattern = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
function parse<T>(schema: z.ZodType<T>, raw: unknown): T { const result = schema.safeParse(raw); if (!result.success) throw new ManagementError(result.error.issues.some(issue => issue.path.includes("description")) ? "Use supported description formatting and safe links, within 6,000 visible characters." : "Check required fields, limits, selected identities and confirmation. Refresh if the record has changed."); return result.data; }
function uuid(id: string) { if (!z.uuid().safeParse(id).success) throw new ManagementError("Research group not found.", 404); return id; }
async function authorized<T>(actor: Principal, id: string | undefined, work: (tx: ResearchTransaction) => Promise<T>, managerOnly = false) {
  return adminDatabase().db.transaction(async tx => { await requireResearchTransaction(tx, actor, id, managerOnly); return work(tx); });
}
async function row(tx: ResearchTransaction, id: string) {
  const [record] = await tx.select(projection).from(researchGroup).where(sql`${researchGroup.id}=${uuid(id)}::uuid and ${researchGroup.deletedAt} is null`);
  if (!record) throw new ManagementError("Research group not found.", 404); return record;
}
function version(record: { version: number }, expected: number) { if (record.version !== expected) throw new ManagementError("This group changed. Reload and review the latest version.", 409); }
async function slugAvailable(tx: ResearchTransaction, slug: string, id = "") {
  if ((await tx.select({ id: researchGroup.id }).from(researchGroup).where(sql`${researchGroup.id}::text<>${id} and (${researchGroup.slug}=${slug} or ${researchGroup.publishedSlug}=${slug})`).limit(1)).length) throw new ManagementError("That URL slug is already reserved by another group.", 409);
}
function storedContent(content: z.infer<typeof groupCreateInput>["content"]) {
  return { ...content, description: descriptionText(content.description), descriptionDocument: typeof content.description === "string" ? null : content.description, coverAlt: `${content.name} cover photo` };
}
export async function deleteResearchGroup(actor: Principal, id: string, raw: unknown) {
  const input = parse(groupDeletionInput, raw);
  return authorized(actor, id, async tx => {
    const current = await row(tx, id); version(current, input.version);
    if (input.phrase !== researchDeletionPhrase(current.name)) throw new ManagementError("Type the exact confirmation phrase for the current group name.");
    await revokeLeadAssignments(tx, actor.id, sql`${researchLeadAssignment.groupId}=${id}::uuid`, "group_deleted");
    const pending = await tx.update(invitation).set({ revokedAt: sql`clock_timestamp()`, tokenDigest: null, updatedAt: sql`clock_timestamp()` }).where(sql`${invitation.researchGroupId}=${id}::uuid and ${invitation.acceptedAt} is null and ${invitation.revokedAt} is null`).returning({ id: invitation.id });
    for (const item of pending) await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action: "Revoked deleted group invitation", targetType: "invitation", targetId: item.id, targetLabel: "Administrator invitation", createdAt: sql`clock_timestamp()` });
    const removed = await tx.update(researchGroupMember).set({ removedAt: sql`clock_timestamp()`, version: sql`${researchGroupMember.version}+1`, updatedAt: sql`clock_timestamp()` }).where(sql`${researchGroupMember.groupId}=${id}::uuid and ${researchGroupMember.removedAt} is null`).returning({ id: researchGroupMember.id, memberId: researchGroupMember.memberId });
    for (const association of removed) await researchAudit(tx, actor.id, id, "Removed research group member", { before: { memberId: association.memberId, associationId: association.id }, after: { memberId: null, associationId: null } });
    await tx.update(researchGroup).set({ deletedAt: sql`clock_timestamp()`, version: sql`${researchGroup.version}+1`, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroup.id, id));
    await researchAudit(tx, actor.id, id, "Deleted research group");
    return { id, invalidatedSlugs: [current.slug, ...(current.publishedSlug ? [current.publishedSlug] : [])], message: "Research group deleted. Members, separate administrator accounts and history are retained." };
  }, true);
}
export async function groupDirectory(actor: Principal, raw: unknown) {
  const query = parse(groupQuery, raw);
  return authorized(actor, undefined, async tx => {
    const where = sql`${researchGroup.deletedAt} is null and ${researchGroup.name} ilike ${pattern(query.q)}`;
    const total = Number((await tx.select({ n: sql`count(*)::int` }).from(researchGroup).where(where))[0].n), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(query.page, pages);
    const rows = await tx.select({ id: researchGroup.id, name: researchGroup.name, slug: researchGroup.slug, status: researchGroup.status, updatedAt: researchGroup.updatedAt }).from(researchGroup).where(where).orderBy(researchGroup.name, researchGroup.id).limit(20).offset((page - 1) * 20);
    return { rows: serialize<Array<{ id: string; name: string; slug: string; status: string; updatedAt: string }>>(rows), total, page, pages };
  }, true);
}
export async function getResearchGroup(actor: Principal, id: string) {
  return authorized(actor, id, async tx => {
    const group = await row(tx, id);
    const [lead] = await tx.select({ id: researchLeadAssignment.id, administratorId: user.id, name: user.name, memberId: member.id }).from(researchLeadAssignment).innerJoin(user, eq(user.id, researchLeadAssignment.administratorId)).innerJoin(member, eq(member.id, researchLeadAssignment.memberId)).where(sql`${researchLeadAssignment.groupId}=${id}::uuid and ${researchLeadAssignment.revokedAt} is null and ${member.status}='active' and ${member.deletedAt} is null and ${user.active}=true and ${user.role}='research_group_lead' and ${user.researchGroupId}=${id}::uuid`);
    const participants = Number((await tx.select({ n: sql`count(*)::int` }).from(researchGroupMember).innerJoin(member, eq(member.id, researchGroupMember.memberId)).where(sql`${researchGroupMember.groupId}=${id}::uuid and ${researchGroupMember.removedAt} is null and ${member.status}='active' and ${member.deletedAt} is null`))[0].n);
    return { group: serialize<GroupRecord>(group), lead: lead ?? null, participants };
  });
}
export async function createResearchGroup(actor: Principal, raw: unknown) {
  const input = parse(groupCreateInput, raw), digest = createHash("sha256").update(JSON.stringify(input.content)).digest("hex");
  return authorized(actor, undefined, async tx => {
    const [prior] = await tx.select({ id: researchGroup.id, digest: researchGroup.creationDigest, deletedAt: researchGroup.deletedAt }).from(researchGroup).where(eq(researchGroup.creationKey, input.requestId));
    if (prior) { if (prior.deletedAt) throw new ManagementError("This request belongs to a deleted group. Start a new group explicitly.", 409); if (prior.digest !== digest) throw new ManagementError("This creation request was already used with different content. Refresh before adding another group.", 409); return { id: prior.id, message: "This request already created a group; no duplicate was added." }; }
    const reserved = new Set((await tx.select({ slug: researchGroup.slug, publishedSlug: researchGroup.publishedSlug }).from(researchGroup)).flatMap(group => [group.slug, group.publishedSlug]));
    const slug = automaticSlug(input.content.name, reserved);
    const id = randomUUID(); await tx.insert(researchGroup).values({ ...storedContent(input.content), slug, id, createdBy: actor.id, creationKey: input.requestId, creationDigest: digest });
    await researchAudit(tx, actor.id, id, "Created research group"); return { id, message: "Group saved as a private draft." };
  }, true);
}
export async function updateResearchGroup(actor: Principal, id: string, raw: unknown) {
  const input = parse(groupUpdateInput, raw);
  return authorized(actor, id, async tx => {
    const current = await row(tx, id); version(current, input.version);
    await tx.update(researchGroup).set({ ...storedContent(input.content), version: current.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroup.id, id));
    await researchAudit(tx, actor.id, id, "Updated research group draft"); return { id, message: "Changes saved privately. Publish explicitly to update the published version." };
  });
}
export async function publishResearchGroup(actor: Principal, id: string, raw: unknown) {
  const input = parse(publicationInput, raw);
  return authorized(actor, id, async tx => {
    const current = await row(tx, id); version(current, input.version);
    const content = groupContentInput.parse(Object.fromEntries(Object.keys(contentProjection).map(key => [key, current[key as keyof GroupContent]])));
    if (input.action === "publish" && (!content.introduction || !descriptionText(content.description).trim() || !content.objectives.length)) throw new ManagementError("Add an introduction, description and focus areas before publishing.");
    await slugAvailable(tx, content.slug, id);
    const published = input.action === "publish";
    content.coverAlt = `${content.name} cover photo`;
    await tx.update(researchGroup).set({ status: published ? "published" : "draft", ...(published ? { publishedContent: content, publishedSlug: content.slug, publishedAt: sql`clock_timestamp()` } : {}), version: current.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroup.id, id));
    await researchAudit(tx, actor.id, id, published ? "Published research group" : "Unpublished research group", { before: { status: current.status }, after: { status: published ? "published" : "draft" } });
    return { id, invalidatedSlugs: [...new Set([current.publishedSlug, content.slug].filter((value): value is string => !!value))], message: published ? "Published version recorded. Public research pages await an approved design; their URLs remain unavailable." : "Group unpublished. Saved content remains private." };
  });
}
export async function eligibleResearchMembers(actor: Principal, id: string, raw: unknown) {
  const query = parse(eligibleQuery, raw);
  return authorized(actor, id, async tx => {
    await row(tx, id);
    const rows = await tx.select(memberProjection).from(member).where(sql`${member.status}='active' and ${member.deletedAt} is null and concat_ws(' ',${member.firstName},${member.lastName},${member.affiliation}) ilike ${pattern(query.q)} and (${query.purpose}='lead' or not exists(select 1 from research_group_member r where r.group_id=${id}::uuid and r.member_id=${member.id} and r.removed_at is null))`).orderBy(member.lastName, member.firstName, member.id).limit(10);
    return { rows: rows as EligibleMember[] };
  }, query.purpose === "lead");
}
export async function researchMembers(actor: Principal, id: string, raw: unknown) {
  const query = parse(groupQuery, raw);
  return authorized(actor, id, async tx => {
    await row(tx, id);
    const where = sql`${researchGroupMember.groupId}=${id}::uuid and ${researchGroupMember.removedAt} is null and ${member.status}='active' and ${member.deletedAt} is null and concat_ws(' ',${member.firstName},${member.lastName},${member.affiliation}) ilike ${pattern(query.q)}`;
    const total = Number((await tx.select({ n: sql`count(*)::int` }).from(researchGroupMember).innerJoin(member, eq(member.id, researchGroupMember.memberId)).where(where))[0].n), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(query.page, pages);
    const rows = await tx.select({ id: researchGroupMember.id, memberId: member.id, firstName: member.firstName, lastName: member.lastName, affiliation: member.affiliation, roleTitle: researchGroupMember.roleTitle, displayOrder: researchGroupMember.displayOrder, version: researchGroupMember.version }).from(researchGroupMember).innerJoin(member, eq(member.id, researchGroupMember.memberId)).where(where).orderBy(researchGroupMember.displayOrder, member.lastName, member.firstName, researchGroupMember.id).limit(20).offset((page - 1) * 20);
    return { rows, total, page, pages };
  });
}
export async function manageResearchMember(actor: Principal, groupId: string, raw: unknown) {
  const input = parse(groupMemberInput, raw);
  return authorized(actor, groupId, async tx => {
    await row(tx, groupId);
    if (input.action === "add") {
      await eligibleMember(tx, input.memberId, input.memberVersion);
      const [prior] = await tx.select().from(researchGroupMember).where(sql`${researchGroupMember.groupId}=${groupId}::uuid and ${researchGroupMember.memberId}=${input.memberId}::uuid and ${researchGroupMember.removedAt} is null`);
      if (prior) { if (prior.roleTitle !== input.roleTitle || prior.displayOrder !== input.displayOrder) throw new ManagementError("This member is already in the group. Edit the existing association instead.", 409); return { id: prior.id, message: "This member is already in the group. No duplicate was added." }; }
      const id = randomUUID(); await tx.insert(researchGroupMember).values({ id, groupId, memberId: input.memberId, roleTitle: input.roleTitle, displayOrder: input.displayOrder, addedBy: actor.id });
      await researchAudit(tx, actor.id, groupId, "Added research group member", { before: { memberId: null, associationId: null }, after: { memberId: input.memberId, associationId: id } }); return { id, message: "Member added to this group. Private member details and public profiles are unchanged." };
    }
    const [current] = await tx.select().from(researchGroupMember).where(sql`${researchGroupMember.id}=${input.id}::uuid and ${researchGroupMember.groupId}=${groupId}::uuid and ${researchGroupMember.removedAt} is null`);
    if (!current || current.version !== input.version) throw new ManagementError("This association changed or was removed. Reload and review the group.", 409);
    await eligibleMember(tx, current.memberId);
    await tx.update(researchGroupMember).set({ ...(input.action === "remove" ? { removedAt: sql`clock_timestamp()` } : { roleTitle: input.roleTitle, displayOrder: input.displayOrder }), version: current.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroupMember.id, current.id));
    await researchAudit(tx, actor.id, groupId, input.action === "remove" ? "Removed research group member" : "Updated research group member", { before: { memberId: current.memberId, associationId: current.id }, after: { memberId: input.action === "remove" ? null : current.memberId, associationId: input.action === "remove" ? null : current.id } });
    return { id: current.id, message: input.action === "remove" ? "Removed from this group. The organisation-wide member record is unchanged." : "Group-specific details saved. Private member details are unchanged." };
  });
}
export async function researchLeadOptions(actor: Principal, id: string) {
  return authorized(actor, id, async tx => {
    await row(tx, id);
    const administrators = await tx.select({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, accessVersion: user.accessVersion }).from(user).where(sql`${user.active}=true and ${user.id}<>${actor.id}::uuid and not exists(select 1 from research_lead_assignment a where a.administrator_id=${user.id} and a.revoked_at is null and a.group_id<>${id}::uuid)`).orderBy(user.name, user.id).limit(200);
    const pending = await tx.select({ id: invitation.id, expiresAt: invitation.expiresAt }).from(invitation).where(sql`${invitation.researchGroupId}=${id}::uuid and ${invitation.acceptedAt} is null and ${invitation.revokedAt} is null`);
    return { administrators, pending: serialize<Array<{ id: string; expiresAt: string }>>(pending) };
  }, true);
}
export async function manageResearchLead(actor: Principal, id: string, raw: unknown) {
  const input = parse(leadInput, raw);
  return authorized(actor, id, async tx => {
    const current = await row(tx, id); version(current, input.version);
    if (input.action === "remove") {
      if (!(await tx.select({ id: researchLeadAssignment.id }).from(researchLeadAssignment).where(sql`${researchLeadAssignment.groupId}=${id}::uuid and ${researchLeadAssignment.revokedAt} is null`)).length) throw new ManagementError("This group has no current Lead assignment. Refresh the group.", 409);
      await revokeLeadAssignments(tx, actor.id, sql`${researchLeadAssignment.groupId}=${id}::uuid`, "removed"); return { id, message: "Lead assignment revoked. Previous sessions cannot access this group; the separate account is retained." };
    }
    await eligibleMember(tx, input.memberId, input.memberVersion);
    const [target] = await tx.select().from(user).where(eq(user.id, input.administratorId));
    if (!target?.active || target.accessVersion !== input.accessVersion) throw new ManagementError("The selected administrator changed or is inactive. Refresh and review.", 409);
    if (target.id === actor.id) throw new ManagementError("You cannot change your own role here.", 409);
    if (target.role === "super_admin" && (await tx.select({ id: user.id }).from(user).where(sql`${user.role}='super_admin' and ${user.active}=true`)).length <= 1) throw new ManagementError("Keep at least one active Super Admin.", 409);
    if ((await tx.select({ id: researchLeadAssignment.id }).from(researchLeadAssignment).where(sql`${researchLeadAssignment.revokedAt} is null and ${researchLeadAssignment.groupId}<>${id}::uuid and (${researchLeadAssignment.administratorId}=${target.id}::uuid or ${researchLeadAssignment.memberId}=${input.memberId}::uuid)`)).length) throw new ManagementError("That administrator or member already leads another group. Remove the prior assignment explicitly first.", 409);
    if ((await tx.select({ id: invitation.id }).from(invitation).where(sql`${invitation.revokedAt} is null and ${invitation.acceptedAt} is null and (${invitation.researchGroupId}=${id}::uuid or ${invitation.memberId}=${input.memberId}::uuid)`)).length) throw new ManagementError("Revoke the conflicting pending Group Lead invitation in Administrators before assigning.", 409);
    await revokeLeadAssignments(tx, actor.id, sql`${researchLeadAssignment.groupId}=${id}::uuid`, "replaced");
    await tx.update(user).set({ role: "research_group_lead", researchGroupId: id, accessVersion: sql`${user.accessVersion}+1`, updatedAt: sql`clock_timestamp()` }).where(eq(user.id, target.id)); await tx.delete(session).where(eq(session.userId, target.id));
    const assignmentId = randomUUID(); await tx.insert(researchLeadAssignment).values({ id: assignmentId, groupId: id, memberId: input.memberId, administratorId: target.id, assignedBy: actor.id });
    await tx.update(researchGroup).set({ version: sql`${researchGroup.version}+1`, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroup.id, id));
    await researchAudit(tx, actor.id, id, "Assigned research group lead", { before: { administratorId: null, memberId: null, associationId: null }, after: { administratorId: target.id, memberId: input.memberId, associationId: assignmentId } });
    return { id, message: "Lead assigned to the reviewed member and group. The administrator's role changed; previous sessions were revoked." };
  }, true);
}
export async function prepareResearchLeadInvitation(actor: Principal, id: string, raw: unknown) {
  const input = parse(leadInvitationInput, raw);
  return authorized(actor, id, async tx => {
    version(await row(tx, id), input.version); const identity = await eligibleMember(tx, input.memberId, input.memberVersion);
    return { action: "invite" as const, role: "research_group_lead" as const, firstName: identity.firstName, lastName: identity.lastName, email: identity.email, researchGroupId: id, memberId: identity.id, memberVersion: identity.version, groupVersion: input.version, confirmIdentity: true as const };
  }, true);
}
export async function researchOverview(actor: Principal) {
  if (actor.role === "editor") return null;
  return authorized(actor, actor.role === "research_group_lead" ? actor.researchGroupId ?? undefined : undefined, async tx => {
    if (actor.role === "research_group_lead") { const group = await row(tx, actor.researchGroupId!); const count = Number((await tx.select({ n: sql`count(*)::int` }).from(researchGroupMember).innerJoin(member, eq(member.id, researchGroupMember.memberId)).where(sql`${researchGroupMember.groupId}=${group.id}::uuid and ${researchGroupMember.removedAt} is null and ${member.deletedAt} is null and ${member.status}='active'`))[0].n); return { group: serialize<GroupRecord>(group), groups: 1, published: group.status === "published" ? 1 : 0, participants: count }; }
    const [counts] = await tx.select({ groups: sql<number>`count(*)::int`, published: sql<number>`count(*) filter(where status='published')::int` }).from(researchGroup).where(sql`${researchGroup.deletedAt} is null`);
    return { ...counts, group: null, participants: null };
  });
}
