import "server-only";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { invitation, researchGroup, researchLeadAssignment } from "../admin/schema.ts";
import { ManagementError } from "../admin/errors.ts";
import { eligibleMember, researchAudit, type ResearchTransaction } from "./security.ts";
export async function validateLeadInvitation(tx: ResearchTransaction, groupId: string, memberId: string, memberVersion: number, exceptInvitationId = "", groupVersion?: number) {
  const identity = await eligibleMember(tx, memberId, memberVersion);
  const [group] = await tx.select().from(researchGroup).where(eq(researchGroup.id, groupId));
  if (!group || group.deletedAt || (groupVersion !== undefined && group.version !== groupVersion)) throw new ManagementError("The selected group changed or is unavailable. Refresh and review.", 409);
  if ((await tx.select({ id: researchLeadAssignment.id }).from(researchLeadAssignment).where(sql`${researchLeadAssignment.revokedAt} is null and (${researchLeadAssignment.groupId}=${groupId}::uuid or ${researchLeadAssignment.memberId}=${memberId}::uuid)`)).length) throw new ManagementError("This group or member already has a Lead assignment. Remove it explicitly before inviting.", 409);
  if ((await tx.select({ id: invitation.id }).from(invitation).where(sql`${invitation.id}::text<>${exceptInvitationId} and ${invitation.acceptedAt} is null and ${invitation.revokedAt} is null and (${invitation.researchGroupId}=${groupId}::uuid or ${invitation.memberId}=${memberId}::uuid)`)).length) throw new ManagementError("A Group Lead invitation already reserves this group or member. Revoke it before continuing.", 409);
  return identity;
}
export async function establishInvitedLead(tx: ResearchTransaction, pending: typeof invitation.$inferSelect, administratorId: string) {
  await tx.insert(researchLeadAssignment).values({ id: randomUUID(), groupId: pending.researchGroupId!, memberId: pending.memberId!, administratorId, assignedBy: pending.issuerId });
  await tx.update(researchGroup).set({ version: sql`${researchGroup.version}+1`, updatedAt: sql`clock_timestamp()` }).where(eq(researchGroup.id, pending.researchGroupId!));
  await researchAudit(tx, pending.issuerId, pending.researchGroupId!, "Assigned research group lead", { before: { administratorId: null, memberId: null }, after: { administratorId, memberId: pending.memberId } });
}
