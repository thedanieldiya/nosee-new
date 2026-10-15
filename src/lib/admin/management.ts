import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { adminDatabase } from "./database.ts";
import { adminConfig } from "./config.ts";
import { user, account, session, auditLog, invitation, invitationSend } from "./schema.ts";
import { managementInput, acceptanceInput } from "./management-input.ts";
import { renderInvitationEmail } from "./invitation-email.ts";
import { invitationTransport, type InvitationTransport, type DeliveryResult } from "./invitation-mail.ts";
import { takeBucket } from "./http.ts";
import type { Principal } from "./policy.ts";
type Transaction = Parameters<Parameters<ReturnType<typeof adminDatabase>["db"]["transaction"]>[0]>[0];
export class ManagementError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
const digest = (code: string) => createHash("sha256").update(code).digest("hex");
async function lock(tx: Transaction) {
  // Shared across account access changes, issue/reissue and redemption; never a process-local mutex.
  await tx.execute(sql`select pg_advisory_xact_lock(4631002)`);
}
export async function requireManagerTransaction(tx: Transaction, actor: Principal) {
  await lock(tx);
  const [current] = await tx.select().from(user).where(eq(user.id, actor.id));
  if (!current?.active || current.role !== "super_admin" || current.accessVersion !== actor.accessVersion) throw new ManagementError("Super Admin access is required.", 403);
  return current;
}
async function audit(tx: Transaction, actorId: string, action: string, targetType: "administrator" | "invitation", targetId: string, targetLabel: string, changes?: typeof auditLog.$inferInsert.changes) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId, action, targetType, targetId, targetLabel, changes });
}
export async function manageAdministrator(actor: Principal, raw: unknown, transport: InvitationTransport | null = invitationTransport()) {
  const parsed = managementInput.safeParse(raw);
  if (!parsed.success) throw new ManagementError("Enter valid administrator details. New Research Group Lead assignments are unavailable until A06.");
  const input = parsed.data;
  if (input.action !== "invite" && input.action !== "resend") {
    await adminDatabase().db.transaction(async tx => {
      await requireManagerTransaction(tx, actor);
      if (input.action === "revoke") {
        const [pending] = await tx.select().from(invitation).where(eq(invitation.id, input.id));
        if (!pending || pending.acceptedAt || pending.revokedAt) throw new ManagementError("This invitation is no longer pending.", 409);
        await tx.update(invitation).set({ revokedAt: new Date(), tokenDigest: null, updatedAt: new Date() }).where(eq(invitation.id, pending.id));
        await audit(tx, actor.id, "Revoked invitation", "invitation", pending.id, `${pending.firstName} ${pending.lastName}`);
        return;
      }
      const [target] = await tx.select().from(user).where(eq(user.id, input.id));
      if (!target) throw new ManagementError("Administrator not found.", 404);
      if (target.id === actor.id) throw new ManagementError("You cannot change your own role or access here.", 409);
      const role = input.action === "change-role" ? input.role : target.role;
      const active = input.action === "activate" ? true : input.action === "deactivate" ? false : target.active;
      if (target.role === "super_admin" && target.active && (role !== "super_admin" || !active)) {
        const rows = await tx.select({ id: user.id }).from(user).where(and(eq(user.role, "super_admin"), eq(user.active, true)));
        if (rows.length <= 1) throw new ManagementError("Keep at least one active Super Admin.", 409);
      }
      if (role === target.role && active === target.active) throw new ManagementError("No account change is needed.", 409);
      await tx.update(user).set({ role, active, researchGroupId: role === "research_group_lead" ? target.researchGroupId : null, accessVersion: target.accessVersion + 1, updatedAt: new Date() }).where(eq(user.id, target.id));
      await tx.delete(session).where(eq(session.userId, target.id));
      await audit(tx, actor.id, input.action === "change-role" ? "Changed administrator role" : active ? "Activated administrator" : "Deactivated administrator", "administrator", target.id, target.name, { before: { role: target.role, active: target.active }, after: { role, active } });
    });
    return { message: "Administrator updated. Previous sessions have been revoked." };
  }
  // Check before generating any credential or persisting any invite/send/audit record.
  if (!transport || !adminConfig()) throw new ManagementError("Email invitations are not configured.", 503);
  if (actor.role !== "super_admin") throw new ManagementError("Super Admin access is required.", 403);
  if (!(await takeBucket(`invitation:issue:${actor.id}`, 3600, 20))) throw new ManagementError("Too many invitations. Try again in an hour.", 429);
  const code = randomBytes(32).toString("base64url"), tokenDigest = digest(code), sendId = randomUUID();
  const prepared = await adminDatabase().db.transaction(async tx => {
    const issuer = await requireManagerTransaction(tx, actor);
    const now = new Date(), expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    let pending;
    if (input.action === "invite") {
      const [existing] = await tx.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${input.email}`);
      if (existing) throw new ManagementError("This email already belongs to an administrator. Use the account's explicit access actions.", 409);
      const [duplicate] = await tx.select({ id: invitation.id }).from(invitation).where(and(eq(invitation.email, input.email), sql`${invitation.acceptedAt} is null AND ${invitation.revokedAt} is null`));
      if (duplicate) throw new ManagementError("A pending invitation already exists. Resend or revoke it.", 409);
      [pending] = await tx.insert(invitation).values({ id: randomUUID(), firstName: input.firstName, lastName: input.lastName, email: input.email, role: input.role, issuerId: actor.id, tokenDigest, expiresAt }).returning();
    } else {
      [pending] = await tx.select().from(invitation).where(eq(invitation.id, input.id));
      if (!pending || pending.acceptedAt || pending.revokedAt) throw new ManagementError("This invitation cannot be reissued. Create a new invitation if needed.", 409);
      const [existing] = await tx.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${pending.email}`);
      if (existing) throw new ManagementError("This email already belongs to an administrator.", 409);
      const [sending] = await tx.select().from(invitationSend).where(and(eq(invitationSend.invitationId, pending.id), eq(invitationSend.status, "sending"), sql`${invitationSend.createdAt} > now() - interval '2 minutes'`));
      if (sending) throw new ManagementError("An email attempt is still in progress. Wait two minutes before recovering it.", 409);
      [pending] = await tx.update(invitation).set({ tokenDigest, issuerId: actor.id, expiresAt, updatedAt: now }).where(eq(invitation.id, pending.id)).returning();
    }
    await tx.insert(invitationSend).values({ id: sendId, invitationId: pending.id, status: "sending" });
    await audit(tx, actor.id, input.action === "invite" ? "Created invitation" : "Reissued invitation", "invitation", pending.id, `${pending.firstName} ${pending.lastName}`);
    await audit(tx, actor.id, "Started invitation email", "invitation", pending.id, `${pending.firstName} ${pending.lastName}`);
    return { pending, inviterName: issuer.name };
  });
  const message = renderInvitationEmail({ ...prepared.pending, role: prepared.pending.role as "super_admin" | "editor", code, inviterName: prepared.inviterName, origin: adminConfig()!.origin });
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let result: DeliveryResult;
  try {
    result = await Promise.race([transport.send({ ...message, to: prepared.pending.email }, { signal: controller.signal, idempotencyKey: sendId }), new Promise<DeliveryResult>(resolve => { timer = setTimeout(() => { controller.abort(); resolve({ status: "unconfirmed" }); }, 10000); })]);
  } catch { result = { status: "unconfirmed" }; }
  finally { clearTimeout(timer); }
  // Never persist an adapter error body, message payload or secret. A crash leaves a recoverable stale send.
  const messageId = result.status === "accepted" && typeof result.messageId === "string" && /^[A-Za-z0-9@._<>:-]{1,200}$/.test(result.messageId) && !result.messageId.includes(code) ? result.messageId : null;
  if (result.status === "accepted" && !messageId) result = { status: "unconfirmed" };
  await adminDatabase().db.transaction(async tx => {
    await lock(tx);
    await tx.update(invitationSend).set({ status: result.status, providerMessageId: messageId, updatedAt: new Date() }).where(eq(invitationSend.id, sendId));
    if (result.status === "failed") await tx.update(invitation).set({ tokenDigest: null, updatedAt: new Date() }).where(and(eq(invitation.id, prepared.pending.id), eq(invitation.tokenDigest, tokenDigest)));
    await audit(tx, actor.id, result.status === "accepted" ? "Invitation email accepted by provider" : result.status === "failed" ? "Invitation email failed" : "Invitation email unconfirmed", "invitation", prepared.pending.id, `${prepared.pending.firstName} ${prepared.pending.lastName}`);
  });
  return { message: result.status === "accepted" ? "Email accepted by provider; inbox delivery is not confirmed. Awaiting acceptance." : result.status === "failed" ? "Email failed. Its code has been revoked; use Resend to try again." : "Delivery is unconfirmed. Check the provider before resending; resend replaces the previous code." };
}
export async function acceptInvitation(raw: unknown) {
  const parsed = acceptanceInput.safeParse(raw);
  if (!parsed.success) throw new ManagementError("Enter a valid invitation code and matching passwords of 15–128 characters.");
  const { code, password } = parsed.data, tokenDigest = digest(code);
  if (!(await takeBucket("invitation:accept:global", 60, 60)) || !(await takeBucket(`invitation:accept:${tokenDigest}`, 900, 5))) throw new ManagementError("Too many attempts. Try again in 15 minutes.", 429);
  const invalid = () => new ManagementError("This invitation is invalid, expired or no longer available.", 400);
  const [candidate] = await adminDatabase().db.select({ id: invitation.id }).from(invitation).where(and(eq(invitation.tokenDigest, tokenDigest), sql`${invitation.expiresAt} > now() AND ${invitation.revokedAt} is null AND ${invitation.acceptedAt} is null`));
  if (!candidate) throw invalid();
  const passwordHash = await hashPassword(password);
  await adminDatabase().db.transaction(async tx => {
    await lock(tx);
    const [pending] = await tx.select().from(invitation).where(and(eq(invitation.id, candidate.id), eq(invitation.tokenDigest, tokenDigest), sql`${invitation.expiresAt} > now() AND ${invitation.revokedAt} is null AND ${invitation.acceptedAt} is null`));
    if (!pending) throw invalid();
    const [existing] = await tx.select({ id: user.id }).from(user).where(sql`lower(${user.email}) = ${pending.email}`);
    if (existing || !["super_admin", "editor"].includes(pending.role)) throw invalid();
    const id = randomUUID();
    await tx.insert(user).values({ id, name: `${pending.firstName} ${pending.lastName}`, firstName: pending.firstName, lastName: pending.lastName, email: pending.email, emailVerified: false, role: pending.role, researchGroupId: null });
    await tx.insert(account).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: passwordHash });
    await tx.update(invitation).set({ tokenDigest: null, acceptedAt: new Date(), acceptedUserId: id, updatedAt: new Date() }).where(eq(invitation.id, pending.id));
    await audit(tx, id, "Accepted invitation", "invitation", pending.id, `${pending.firstName} ${pending.lastName}`);
    await audit(tx, id, "Activated invited administrator", "administrator", id, `${pending.firstName} ${pending.lastName}`);
  });
  return { message: "Your account is ready. Sign in with your invited email and new password." };
}
