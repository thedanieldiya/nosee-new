import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql, type SQL } from "drizzle-orm";
import type { adminDatabase } from "../admin/database.ts";
import { user, session, member, auditLog, researchGroup, researchGroupMember, researchLeadAssignment, invitation } from "../admin/schema.ts";
import { ManagementError } from "../admin/errors.ts";
import type { Principal } from "../admin/policy.ts";
export type ResearchTransaction = Parameters<Parameters<ReturnType<typeof adminDatabase>["db"]["transaction"]>[0]>[0];
export async function validLeadAssignment(tx: Pick<ResearchTransaction, "select">, administratorId: string, groupId: string | null) {
  if (!groupId) return false;
  return !!(await tx.select({ id: researchLeadAssignment.id }).from(researchLeadAssignment).innerJoin(member, eq(member.id, researchLeadAssignment.memberId)).innerJoin(researchGroup, eq(researchGroup.id, researchLeadAssignment.groupId)).where(sql`${researchLeadAssignment.administratorId}=${administratorId}::uuid and ${researchLeadAssignment.groupId}=${groupId}::uuid and ${researchLeadAssignment.revokedAt} is null and ${member.status}='active' and ${member.deletedAt} is null`).limit(1)).length;
}
export async function requireResearchTransaction(tx: ResearchTransaction, actor: Principal, groupId?: string, managerOnly = false) {
  // Same lock as membership, administrator access and invitation redemption: one authority boundary.
  await tx.execute(sql`select pg_advisory_xact_lock(4631002)`);
  const [current] = await tx.select().from(user).where(eq(user.id, actor.id));
  if (!current?.active || current.accessVersion !== actor.accessVersion) throw new ManagementError("Current administrator access is required.", 403);
  if (current.role === "super_admin") return current;
  if (managerOnly || current.role !== "research_group_lead" || current.researchGroupId !== groupId || !(await validLeadAssignment(tx, current.id, current.researchGroupId))) throw new ManagementError("Access to this research group is not permitted.", 403);
  return current;
}
export async function eligibleMember(tx: ResearchTransaction, id: string, version?: number) {
  const [record] = await tx.select().from(member).where(sql`${member.id}=${id}::uuid and ${member.deletedAt} is null and ${member.status}='active'`);
  if (!record || (version !== undefined && record.version !== version)) throw new ManagementError("The selected member is no longer eligible or has changed. Refresh and review the identity.", 409);
  return record;
}
export async function researchAudit(tx: ResearchTransaction, actorId: string, groupId: string, action: string, changes?: typeof auditLog.$inferInsert.changes) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId, action, targetType: "research_group", targetId: groupId, targetLabel: "Research group", changes, createdAt: sql`clock_timestamp()` });
}
export async function revokeLeadAssignments(tx: ResearchTransaction, actorId: string, filter: SQL, reason: string) {
  const current = await tx.select().from(researchLeadAssignment).where(sql`${researchLeadAssignment.revokedAt} is null and ${filter}`);
  for (const assignment of current) {
    await tx.update(researchLeadAssignment).set({ revokedAt: sql`clock_timestamp()`, revokedBy: actorId, revocationReason: reason }).where(eq(researchLeadAssignment.id, assignment.id));
    // Keep the separate account/role; without a valid assignment it cannot gain research access.
    await tx.update(user).set({ accessVersion: sql`${user.accessVersion}+1`, updatedAt: sql`clock_timestamp()` }).where(eq(user.id, assignment.administratorId));
    await tx.delete(session).where(eq(session.userId, assignment.administratorId));
    await tx.update(researchGroup).set({ version: sql`${researchGroup.version}+1`, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroup.id, assignment.groupId));
    await researchAudit(tx, actorId, assignment.groupId, "Revoked research group lead", { before: { administratorId: assignment.administratorId, memberId: assignment.memberId, associationId: assignment.id }, after: { administratorId: null, memberId: null, associationId: null } });
  }
}
export async function revokeMemberResearch(tx: ResearchTransaction, actorId: string, memberId: string) {
  const removed = await tx.update(researchGroupMember).set({ removedAt: sql`clock_timestamp()`, version: sql`${researchGroupMember.version}+1`, updatedAt: sql`clock_timestamp()` }).where(sql`${researchGroupMember.memberId}=${memberId}::uuid and ${researchGroupMember.removedAt} is null`).returning();
  for (const association of removed) await researchAudit(tx, actorId, association.groupId, "Removed research group member", { before: { memberId, associationId: association.id }, after: { memberId: null, associationId: null } });
  await revokeLeadAssignments(tx, actorId, sql`${researchLeadAssignment.memberId}=${memberId}::uuid`, "membership_ineligible");
  const revoked = await tx.update(invitation).set({ revokedAt: sql`clock_timestamp()`, tokenDigest: null, updatedAt: sql`clock_timestamp()` }).where(sql`${invitation.memberId}=${memberId}::uuid and ${invitation.role}='research_group_lead' and ${invitation.revokedAt} is null and ${invitation.acceptedAt} is null`).returning({ id: invitation.id });
  for (const pending of revoked) await tx.insert(auditLog).values({ id: randomUUID(), actorId, action: "Revoked ineligible group lead invitation", targetType: "invitation", targetId: pending.id, targetLabel: "Administrator invitation", createdAt: sql`clock_timestamp()` });
}
