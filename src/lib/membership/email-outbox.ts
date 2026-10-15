import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { auditLog, membershipApplication, membershipNotification, membershipMailControl } from "../admin/schema.ts";
import { requireManagerTransaction, ManagementError } from "../admin/management.ts";
import type { Principal } from "../admin/policy.ts";
import { sendResendMessage, type ResendOutcome } from "../admin/resend-request.ts";
import { membershipEmailConfig, type MembershipEmailConfig } from "./email-config.ts";
import { renderMembershipEmail } from "./email-template.ts";
import type { MembershipEmailKind, MembershipEmailState } from "./email-options.ts";
type Transaction = Parameters<Parameters<ReturnType<typeof adminDatabase>["db"]["transaction"]>[0]>[0];
type Job = typeof membershipNotification.$inferSelect;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const backoff = [60, 300, 1800, 7200];
async function workerLock(tx: Transaction) { await tx.execute(sql`select pg_advisory_xact_lock(4631004)`); }
async function audit(tx: Transaction, id: string, before: string, after: string) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId: null, action: "Membership email status changed", targetType: "membership_notification", targetId: id, targetLabel: "Membership notification", changes: { before: { status: before }, after: { status: after } }, createdAt: sql`clock_timestamp()` });
}
export async function recordMembershipEmails(tx: Transaction, applicationId: string, event: "received" | "approved" | "rejected") {
  const config = membershipEmailConfig(process.env), now = new Date((await tx.execute<{ now: string }>(sql`select clock_timestamp() now`)).rows[0].now);
  const eligible = !!config && now.getTime() >= Date.parse(config.startAt);
  const [application] = await tx.select({ email: membershipApplication.email }).from(membershipApplication).where(eq(membershipApplication.id, applicationId));
  if (!application) throw new Error("Application notification could not be recorded.");
  const kinds: MembershipEmailKind[] = event === "received" ? ["receipt", "admin_alert"] : [event === "approved" ? "approval" : "rejection"];
  for (const kind of kinds) {
    const recipients = eligible && kind === "admin_alert" ? config.recipients : [null];
    for (const recipient of recipients) {
      const overlap = recipient === application.email.toLowerCase(), queued = eligible && !overlap;
      await tx.insert(membershipNotification).values({ id: randomUUID(), applicationId, kind,
        recipientKey: kind !== "admin_alert" ? "applicant" : recipient ? digest(recipient) : "administrators",
        administratorRecipient: queued && kind === "admin_alert" ? recipient : null,
        templateVersion: kind === "approval" ? 2 : 1, state: queued ? "queued" : "held", fromAddress: queued ? config.from : null, origin: queued ? config.origin : null, activationKey: queued ? config.activationKey : null,
        nextAttemptAt: queued ? now : null, lastIssue: overlap ? "recipient_overlap" : queued ? null : "not_activated", createdAt: now, updatedAt: now,
      }).onConflictDoNothing({ target: [membershipNotification.applicationId, membershipNotification.kind, membershipNotification.recipientKey] });
    }
  }
}
export async function applicationEmailSummary(actor: Principal, applicationId: string) {
  return adminDatabase().db.transaction(async tx => {
    await requireManagerTransaction(tx, actor);
    const rows = await tx.select({ id: membershipNotification.id, kind: membershipNotification.kind, state: membershipNotification.state, attempts: membershipNotification.attempts, nextAttemptAt: membershipNotification.nextAttemptAt, leaseUntil: membershipNotification.leaseUntil, lastIssue: membershipNotification.lastIssue, activationKey: membershipNotification.activationKey }).from(membershipNotification).where(eq(membershipNotification.applicationId, applicationId)).orderBy(membershipNotification.createdAt, membershipNotification.id);
    const config = membershipEmailConfig(process.env);
    const now = new Date((await tx.execute<{ now: string }>(sql`select clock_timestamp() now`)).rows[0].now);
    return { enabled: !!config, rows: rows.map(row => ({ id: row.id, kind: row.kind, state: row.state === "sending" && row.leaseUntil && row.leaseUntil <= now ? "unconfirmed" as MembershipEmailState : row.state, attempts: row.attempts, nextAttemptAt: row.nextAttemptAt?.toISOString() ?? null, paused: !!row.activationKey && row.activationKey !== config?.activationKey && (row.state === "queued" || row.state === "sending" || (row.state === "unconfirmed" && !!row.nextAttemptAt)), issue: row.lastIssue })) };
  });
}
async function recoverClaims(tx: Transaction) {
  const expired = (await tx.execute<{ id: string }>(sql`with due as (select id from membership_notification where state='sending' and lease_until<=clock_timestamp() order by lease_until,id limit 100 for update skip locked)
    update membership_notification n set state='unconfirmed',uncertain=true,claim_token=null,lease_until=null,last_issue='interrupted_claim',updated_at=clock_timestamp(),
      next_attempt_at=case when attempts<5 and first_attempt_at+interval '23 hours'>clock_timestamp()+interval '60 seconds' then clock_timestamp()+interval '60 seconds' else null end
    where n.id in (select id from due) returning n.id`)).rows;
  if (expired.length) await tx.insert(auditLog).values(expired.map(row => ({ id: randomUUID(), actorId: null, action: "Membership email status changed", targetType: "membership_notification", targetId: row.id, targetLabel: "Membership notification", changes: { before: { status: "sending" }, after: { status: "unconfirmed" } }, createdAt: sql`clock_timestamp()` })));
}
async function claim(config: MembershipEmailConfig) {
  return adminDatabase().db.transaction(async tx => {
    await workerLock(tx); await recoverClaims(tx);
    const now = new Date((await tx.execute<{ now: string }>(sql`select clock_timestamp() now`)).rows[0].now);
    const [control] = await tx.select().from(membershipMailControl).where(eq(membershipMailControl.id, "membership"));
    if (!control) throw new Error("Membership mail migration is required.");
    if (control.nextDispatchAt > now) return { job: null, wait: true };
    const [job] = await tx.select().from(membershipNotification).where(sql`${membershipNotification.state} in ('queued','unconfirmed') and ${membershipNotification.nextAttemptAt}<=${now} and ${membershipNotification.activationKey}=${config.activationKey} and ${membershipNotification.createdAt}>=${new Date(config.startAt)}`).orderBy(membershipNotification.nextAttemptAt, membershipNotification.createdAt, membershipNotification.id).limit(1).for("update", { skipLocked: true });
    if (!job) return { job: null, wait: false };
    if (job.attempts >= 5 || (job.firstAttemptAt && job.firstAttemptAt.getTime() + 23 * 3600000 <= now.getTime())) {
      const state = job.uncertain ? "unconfirmed" : "failed";
      await tx.update(membershipNotification).set({ state, nextAttemptAt: null, lastIssue: "retry_window_closed", updatedAt: now }).where(eq(membershipNotification.id, job.id));
      await audit(tx, job.id, job.state, state); return { job: null, wait: false, stopped: true };
    }
    const token = randomUUID(), [saved] = await tx.update(membershipNotification).set({ state: "sending", claimToken: token, leaseUntil: new Date(now.getTime() + 120000), attempts: job.attempts + 1, firstAttemptAt: job.firstAttemptAt ?? now, nextAttemptAt: null, updatedAt: now }).where(eq(membershipNotification.id, job.id)).returning();
    await tx.update(membershipMailControl).set({ nextDispatchAt: new Date(now.getTime() + 1000) }).where(eq(membershipMailControl.id, "membership"));
    await audit(tx, job.id, job.state, "sending"); return { job: saved, wait: false };
  });
}
async function prepare(job: Job) {
  return adminDatabase().db.transaction(async tx => {
    await workerLock(tx);
    const [current] = await tx.select().from(membershipNotification).where(eq(membershipNotification.id, job.id));
    const now = new Date((await tx.execute<{ now: string }>(sql`select clock_timestamp() now`)).rows[0].now);
    if (current?.claimToken !== job.claimToken || current.state !== "sending" || !current.leaseUntil || current.leaseUntil <= now) return null;
    const [application] = await tx.select({ firstName: membershipApplication.firstName, email: membershipApplication.email }).from(membershipApplication).where(eq(membershipApplication.id, job.applicationId));
    if (!application || !job.fromAddress || !job.origin) throw new Error("Membership email cannot be prepared.");
    const message = { to: job.kind === "admin_alert" ? job.administratorRecipient! : application.email, ...renderMembershipEmail({ kind: job.kind, firstName: application.firstName, applicationId: job.applicationId, origin: job.origin, templateVersion: job.templateVersion }) };
    const payloadDigest = digest(JSON.stringify({ from: job.fromAddress, ...message }));
    if (current.payloadDigest && current.payloadDigest !== payloadDigest) {
      const state = current.uncertain || current.attempts > 1 ? "unconfirmed" : "failed";
      await tx.update(membershipNotification).set({ state, nextAttemptAt: null, claimToken: null, leaseUntil: null, lastIssue: "payload_changed", updatedAt: sql`clock_timestamp()` }).where(eq(membershipNotification.id, job.id));
      await audit(tx, job.id, "sending", state); return null;
    }
    await tx.update(membershipNotification).set({ payloadDigest }).where(eq(membershipNotification.id, job.id)); return message;
  });
}
async function finish(job: Job, outcome: ResendOutcome) {
  return adminDatabase().db.transaction(async tx => {
    await workerLock(tx);
    const [current] = await tx.select().from(membershipNotification).where(eq(membershipNotification.id, job.id));
    if (current?.claimToken !== job.claimToken || current.state !== "sending") return "unconfirmed";
    const now = new Date((await tx.execute<{ now: string }>(sql`select clock_timestamp() now`)).rows[0].now);
    const accepted = outcome.delivery.status === "accepted", uncertain = current.uncertain || outcome.delivery.status === "unconfirmed";
    const delay = Math.max(backoff[Math.min(current.attempts - 1, backoff.length - 1)], outcome.retryAfterSeconds ?? 0), next = new Date(now.getTime() + delay * 1000);
    const retry = !accepted && outcome.retryable && current.attempts < 5 && current.firstAttemptAt!.getTime() + 23 * 3600000 > next.getTime();
    const state: MembershipEmailState = accepted ? "accepted" : uncertain ? "unconfirmed" : retry ? "queued" : "failed";
    await tx.update(membershipNotification).set({ state, uncertain: accepted ? false : uncertain, nextAttemptAt: retry ? next : null, claimToken: null, leaseUntil: null, providerMessageId: outcome.delivery.status === "accepted" ? outcome.delivery.messageId : null, lastIssue: accepted ? null : retry ? outcome.issue ?? "unconfirmed" : current.attempts >= 5 ? "attempts_exhausted" : outcome.issue ?? "retry_window_closed", updatedAt: now }).where(eq(membershipNotification.id, job.id));
    if (outcome.issue === "rate_limited") await tx.update(membershipMailControl).set({ nextDispatchAt: sql`greatest(${membershipMailControl.nextDispatchAt},${next})` }).where(eq(membershipMailControl.id, "membership"));
    await audit(tx, job.id, "sending", state); return state;
  });
}
export async function runMembershipEmailWorker(request: typeof fetch = fetch) {
  const config = membershipEmailConfig(process.env);
  if (!config) return { enabled: false, processed: 0, outcome: "disabled" };
  const claimed = await claim(config);
  if (!claimed.job) return { enabled: true, processed: 0, outcome: claimed.wait ? "rate_limited" : claimed.stopped ? "stopped" : "idle" };
  const job = claimed.job;
  try {
    const message = await prepare(job);
    if (!message) return { enabled: true, processed: 0, outcome: "unconfirmed" };
    // A process can resume after prepare/commit; do not start an old claim's request.
    const withinClaim: typeof fetch = (input, init) => {
      if (Date.now() >= Math.min(job.leaseUntil!.getTime(), job.firstAttemptAt!.getTime() + 23 * 3600000)) throw new Error("Membership email claim expired.");
      return request(input, init);
    };
    const outcome = await sendResendMessage({ apiKey: config.apiKey, from: job.fromAddress! }, message, { idempotencyKey: `nosee-membership/${job.id}`, signal: new AbortController().signal }, withinClaim);
    return { enabled: true, processed: 1, outcome: await finish(job, outcome) };
  } catch {
    // A crashed/failed persistence step leaves a leased claim, never a false acceptance.
    throw new ManagementError("Membership notification processing could not be confirmed. Retry the worker later.", 503);
  }
}
