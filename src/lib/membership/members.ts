import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { eq, sql, type SQL } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { requireManagerTransaction, ManagementError } from "../admin/management.ts";
import { member, membershipApplication, applicationMember, leadershipProfileIdentity, auditLog } from "../admin/schema.ts";
import type { Principal } from "../admin/policy.ts";
import type { MemberFields } from "./member-options.ts";
import type { ApplicationStatus } from "./options.ts";
import { memberCreateInput, memberUpdateInput, memberQuery, memberMatchInput, applicationMemberInput, profileLinkInput } from "./member-input.ts";
type Transaction = Parameters<Parameters<ReturnType<typeof adminDatabase>["db"]["transaction"]>[0]>[0];
export type MemberRecord = MemberFields & { id: string; version: number; leadershipProfileId: string | null; createdAt: string; updatedAt: string };
export type MemberMatch = Pick<MemberRecord, "id" | "firstName" | "lastName" | "email" | "affiliation" | "status" | "joinDate" | "version">;
export type ProfileIdentity = { id: string; displayName: string; roleTitle: string; affiliation: string };
const projection = { id: member.id, firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone, affiliation: member.affiliation, careerStage: member.careerStage, researchInterests: member.researchInterests, status: member.status, joinDate: member.joinDate, notes: member.notes, version: member.version, leadershipProfileId: member.leadershipProfileId, createdAt: member.createdAt, updatedAt: member.updatedAt };
const matchProjection = { id: member.id, firstName: member.firstName, lastName: member.lastName, email: member.email, affiliation: member.affiliation, status: member.status, joinDate: member.joinDate, version: member.version };
const profileProjection = { id: leadershipProfileIdentity.id, displayName: leadershipProfileIdentity.displayName, roleTitle: leadershipProfileIdentity.roleTitle, affiliation: leadershipProfileIdentity.affiliation };
const serialized = <T>(value: unknown) => JSON.parse(JSON.stringify(value)) as T;
const pattern = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ManagementError("Check the required fields, allowed choices, input limits, real join date and confirmation. Reload if this record has changed.");
  return result.data;
}
function uuid(value: string) { if (!z.uuid().safeParse(value).success) throw new ManagementError("Record not found.", 404); return value; }
async function authorized<T>(actor: Principal, work: (tx: Transaction) => Promise<T>) {
  return adminDatabase().db.transaction(async tx => { await requireManagerTransaction(tx, actor); return work(tx); });
}
async function audit(tx: Transaction, actor: Principal, id: string, action: string, changes?: typeof auditLog.$inferInsert.changes, application = false) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action, targetType: application ? "membership_application" : "member", targetId: id, targetLabel: application ? "Membership application" : "Member", changes, createdAt: sql`clock_timestamp()` });
}
async function memberRow(tx: Transaction, id: string) {
  const [record] = await tx.select(projection).from(member).where(eq(member.id, uuid(id)));
  if (!record) throw new ManagementError("Member not found.", 404);
  return record;
}
async function duplicate(tx: Transaction, email: string, exclude = "") {
  return (await tx.select(matchProjection).from(member).where(sql`lower(${member.email})=${email} and ${member.id}::text<>${exclude}`).limit(1))[0] ?? null;
}
async function insertMember(tx: Transaction, actor: Principal, fields: MemberFields, requestId: string) {
  fields.researchInterests.sort();
  const digest = createHash("sha256").update(JSON.stringify(fields)).digest("hex");
  const [prior] = await tx.select({ id: member.id, digest: member.creationDigest }).from(member).where(eq(member.creationKey, requestId));
  if (prior) {
    if (prior.digest !== digest) throw new ManagementError("This creation request was already used with different details. Reload and review the member.", 409);
    return { id: prior.id, created: false };
  }
  if (await duplicate(tx, fields.email)) throw new ManagementError("A member with this normalized email already exists. Review the existing record; nothing was overwritten.", 409);
  const id = randomUUID();
  await tx.insert(member).values({ ...fields, id, creationKey: requestId, creationDigest: digest, createdAt: sql`clock_timestamp()`, updatedAt: sql`clock_timestamp()` });
  await audit(tx, actor, id, "Created member"); return { id, created: true };
}
export async function createMember(actor: Principal, raw: unknown) {
  const input = parse(memberCreateInput, raw);
  return authorized(actor, async tx => {
    const saved = await insertMember(tx, actor, input.fields, input.requestId);
    return { ...saved, message: saved.created ? "Member record saved. No administrator access, email or public profile was created." : "This creation request already has a member record. No new record or changes were made." };
  });
}
export async function updateMember(actor: Principal, id: string, raw: unknown) {
  const input = parse(memberUpdateInput, raw);
  return authorized(actor, async tx => {
    const current = await memberRow(tx, id);
    if (current.version !== input.version) throw new ManagementError("This member changed since you opened it. Your edits were not saved. Reload and review the latest record.", 409);
    if (await duplicate(tx, input.fields.email, id)) throw new ManagementError("A member with this normalized email already exists. Review the existing record; nothing was overwritten.", 409);
    const fields = { ...input.fields, researchInterests: [...input.fields.researchInterests].sort() };
    const [saved] = await tx.update(member).set({ ...fields, version: current.version + 1, updatedAt: sql`clock_timestamp()` }).where(sql`${member.id}=${id}::uuid and ${member.version}=${input.version}`).returning({ id: member.id, version: member.version });
    if (!saved) throw new ManagementError("This member changed. Reload before trying again.", 409);
    const statusChanged = current.status !== fields.status;
    await audit(tx, actor, id, statusChanged ? "Changed membership status" : "Updated member", statusChanged ? { before: { status: current.status }, after: { status: fields.status } } : undefined);
    return { ...saved, message: "Member updated. Administrator access and public profiles are unchanged." };
  });
}
export async function memberDirectory(actor: Principal, raw: unknown) {
  const query = parse(memberQuery, raw);
  return authorized(actor, async tx => {
    const predicates: SQL[] = [sql`true`];
    if (query.q) predicates.push(sql`concat_ws(' ',${member.firstName},${member.lastName},${member.email},${member.affiliation}) ilike ${pattern(query.q)}`);
    if (query.status) predicates.push(eq(member.status, query.status));
    if (query.interest) predicates.push(sql`${query.interest}=any(${member.researchInterests})`);
    const where = sql.join(predicates, sql` and `), total = Number((await tx.select({ n: sql<number>`count(*)::int` }).from(member).where(where))[0].n), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(query.page, pages);
    const rows = await tx.select(matchProjection).from(member).where(where).orderBy(sql`${member.createdAt} desc,${member.id} desc`).limit(20).offset((page - 1) * 20);
    return { rows, total, page, pages };
  });
}
export async function memberMatches(actor: Principal, raw: unknown) {
  const query = parse(memberMatchInput, raw);
  return authorized(actor, async tx => {
    const exact = query.email ? await duplicate(tx, query.email, query.exclude) : null;
    const suggestions = query.firstName && query.lastName ? await tx.select(matchProjection).from(member).where(sql`${member.id}::text<>${query.exclude} and ${member.firstName} ilike ${pattern(query.firstName)} and ${member.lastName} ilike ${pattern(query.lastName)}`).orderBy(member.lastName, member.firstName, member.id).limit(10) : [];
    return { duplicate: exact, suggestions };
  });
}
export async function getMember(actor: Principal, id: string) {
  return authorized(actor, async tx => {
    const record = await memberRow(tx, id);
    const applications = await tx.select({ id: membershipApplication.id, createdAt: membershipApplication.createdAt, associatedAt: applicationMember.createdAt }).from(applicationMember).innerJoin(membershipApplication, eq(membershipApplication.id, applicationMember.applicationId)).where(eq(applicationMember.memberId, id)).orderBy(sql`${applicationMember.createdAt} desc,${membershipApplication.id} desc`);
    const profile = record.leadershipProfileId ? (await tx.select(profileProjection).from(leadershipProfileIdentity).where(eq(leadershipProfileIdentity.id, record.leadershipProfileId)))[0] : null;
    return { member: serialized<MemberRecord>(record), applications: serialized<Array<{ id: string; createdAt: string; associatedAt: string }>>(applications), profile: profile ?? null };
  });
}
export async function applicationMemberContext(actor: Principal, id: string) {
  return authorized(actor, async tx => {
    const [application] = await tx.select({ id: membershipApplication.id, firstName: membershipApplication.firstName, lastName: membershipApplication.lastName, email: membershipApplication.email, careerStage: membershipApplication.careerStage, researchInterests: membershipApplication.researchInterests, status: sql<ApplicationStatus>`case when ${membershipApplication.status}='pending' and ${membershipApplication.expiresAt}<=statement_timestamp() then 'expired' else ${membershipApplication.status}::text end` }).from(membershipApplication).where(eq(membershipApplication.id, uuid(id)));
    if (!application) throw new ManagementError("Application not found.", 404);
    const [association] = await tx.select({ memberId: applicationMember.memberId }).from(applicationMember).where(eq(applicationMember.applicationId, id));
    const associated = association ? await memberRow(tx, association.memberId) : null;
    return { application, associated: associated ? serialized<MemberRecord>(associated) : null, existing: !associated && application.status === "approved" ? await duplicate(tx, application.email.toLowerCase()) : null };
  });
}
export async function convertApplication(actor: Principal, id: string, raw: unknown) {
  const input = parse(applicationMemberInput, raw);
  return authorized(actor, async tx => {
    const [application] = await tx.select().from(membershipApplication).where(eq(membershipApplication.id, uuid(id)));
    if (!application) throw new ManagementError("Application not found.", 404);
    if (application.status !== "approved") throw new ManagementError("Only approved applications can be associated with a member.", 409);
    const [prior] = await tx.select().from(applicationMember).where(eq(applicationMember.applicationId, id));
    if (prior) {
      if (input.action === "associate" && input.memberId !== prior.memberId) throw new ManagementError("This application is already associated with a different member. Nothing was changed.", 409);
      return { id: prior.memberId, created: false, message: "This application is already associated with a member. No record was changed." };
    }
    let memberId: string, created = false;
    if (input.action === "associate") {
      const current = await memberRow(tx, input.memberId);
      if (current.version !== input.version) throw new ManagementError("The member changed. Reload and review its latest details before association.", 409);
      if (current.email.toLowerCase() !== application.email.toLowerCase()) throw new ManagementError("The member email must match the approved application. Review these identities separately.", 409);
      memberId = current.id;
    } else {
      const fields = input.fields;
      if (fields.firstName !== application.firstName || fields.lastName !== application.lastName || fields.email !== application.email.toLowerCase() || fields.careerStage !== application.careerStage || [...fields.researchInterests].sort().join() !== [...application.researchInterests].sort().join()) throw new ManagementError("Preserve the approved application’s name, email, career stage and research interests during conversion. Reload its prefilled form.");
      const saved = await insertMember(tx, actor, fields, input.requestId);
      if (!saved.created) throw new ManagementError("An existing member requires explicit identity review and association. Nothing was changed.", 409);
      memberId = saved.id; created = true;
      // A retried creation key must never silently become an association with an edited identity.
      const current = await memberRow(tx, memberId);
      if (current.email.toLowerCase() !== application.email.toLowerCase()) throw new ManagementError("The member changed. Review it explicitly before associating this application.", 409);
    }
    await tx.insert(applicationMember).values({ applicationId: id, memberId, associatedBy: actor.id, createdAt: sql`clock_timestamp()` });
    await audit(tx, actor, id, "Associated membership application", { before: { memberId: null }, after: { memberId } }, true);
    return { id: memberId, created, message: created ? "Member created and associated. Original application answers and decision are retained; no administrator access, email or public profile was created." : "Application associated with the existing member. Its details were not overwritten." };
  });
}
export async function profileLinkOptions(actor: Principal, id: string) {
  return authorized(actor, async tx => {
    const current = await memberRow(tx, id);
    const profiles = await tx.select(profileProjection).from(leadershipProfileIdentity).where(sql`not exists(select 1 from member m where m.leadership_profile_id=${leadershipProfileIdentity.id} and m.id<>${id}::uuid)`).orderBy(leadershipProfileIdentity.displayName, leadershipProfileIdentity.id).limit(100);
    const available = Number((await tx.select({ n: sql<number>`count(*)::int` }).from(leadershipProfileIdentity))[0].n) > 0;
    return { profiles, available, version: current.version };
  });
}
export async function linkMemberProfile(actor: Principal, id: string, raw: unknown) {
  const input = parse(profileLinkInput, raw);
  return authorized(actor, async tx => {
    const current = await memberRow(tx, id);
    if (current.version !== input.version) throw new ManagementError("The member or its link changed. Reload and review the latest record.", 409);
    if (current.leadershipProfileId === input.profileId) return { id, version: current.version, message: "The profile association is already in this state. Nothing was changed." };
    if (current.leadershipProfileId && input.profileId) throw new ManagementError("Unlink the current profile explicitly before choosing another identity.", 409);
    if (input.profileId) {
      if (!(await tx.select({ id: leadershipProfileIdentity.id }).from(leadershipProfileIdentity).where(eq(leadershipProfileIdentity.id, input.profileId))).length) throw new ManagementError("Leadership profile not found. A10 must provide a real persistent identity.", 404);
      if ((await tx.select({ id: member.id }).from(member).where(eq(member.leadershipProfileId, input.profileId))).length) throw new ManagementError("That profile is already linked to another member. Review both identities; nothing was changed.", 409);
    }
    const [saved] = await tx.update(member).set({ leadershipProfileId: input.profileId, version: current.version + 1, updatedAt: sql`clock_timestamp()` }).where(sql`${member.id}=${id}::uuid and ${member.version}=${input.version}`).returning({ id: member.id, version: member.version });
    if (!saved) throw new ManagementError("The member changed. Reload before trying again.", 409);
    await audit(tx, actor, id, input.profileId ? "Linked leadership profile" : "Unlinked leadership profile", { before: { profileId: current.leadershipProfileId }, after: { profileId: input.profileId } });
    return { ...saved, message: "Identity association saved. Public profile content and visibility were not changed." };
  });
}
