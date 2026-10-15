import "server-only";
import { recordMembershipEmails } from "./email-outbox.ts";
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { sql, eq, and, type SQL } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { adminConfig } from "../admin/config.ts";
import { takeBucket } from "../admin/http.ts";
import { ManagementError, requireManagerTransaction } from "../admin/management.ts";
import { auditLog, membershipApplication } from "../admin/schema.ts";
import type { Principal } from "../admin/policy.ts";
import { applicationInput, submissionInput, applicationQuery, decisionInput } from "./input.ts";
import { validApplicationToken, tokenDigest, applicationFingerprint } from "./form-guard.ts";
import { membershipConsent, type ApplicationStatus } from "./options.ts";
type Transaction = Parameters<Parameters<ReturnType<typeof adminDatabase>["db"]["transaction"]>[0]>[0];
export class ApplicationError extends ManagementError {
  errors: Record<string, string>;
  constructor(message: string, status = 400, errors: Record<string, string> = {}) { super(message, status); this.errors = errors; }
}
export type ApplicationRecord = { id: string; firstName: string; lastName: string; email: string; careerStage: string; researchInterests: string[]; why: string; consentedAt: string; consentVersion: string; privacyVersion: string; status: ApplicationStatus; createdAt: string; expiresAt: string; reviewedAt: string | null; reviewer: string | null; reviewNote: string | null };
async function lock(tx: Transaction) { await tx.execute(sql`select pg_advisory_xact_lock(4631003)`); }
async function recordEvent(tx: Transaction, id: string, action: string, before?: ApplicationStatus, after?: ApplicationStatus, actorId: string | null = null) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId, action, targetType: "membership_application", targetId: id, targetLabel: "Membership application", createdAt: sql`clock_timestamp()`, ...(before && after ? { changes: { before: { status: before }, after: { status: after } } } : {}) });
}
// The shared transaction lock serializes expiry, submission and decisions across instances.
async function persistExpiry(tx: Transaction, condition: SQL = sql`true`) {
  const rows = (await tx.execute<{ id: string }>(sql`with instant as materialized (select clock_timestamp() at)
    update membership_application a set status='expired',updated_at=instant.at from instant
    where a.id in (select id from membership_application where status='pending' and expires_at<=instant.at and ${condition} order by expires_at,id limit 500)
      and a.status='pending' returning a.id`)).rows;
  if (rows.length) await tx.insert(auditLog).values(rows.map(row => ({ id: randomUUID(), actorId: null, action: "Expired membership application", targetType: "membership_application", targetId: row.id, targetLabel: "Membership application", createdAt: sql`clock_timestamp()`, changes: { before: { status: "pending" }, after: { status: "expired" } } })));
  return rows.length;
}
export async function expireMembershipApplications() {
  return adminDatabase().db.transaction(async tx => {
    await lock(tx); const expired = await persistExpiry(tx);
    const remaining = (await tx.execute<{ due: boolean }>(sql`select exists(select 1 from membership_application where status='pending' and expires_at<=clock_timestamp()) due`)).rows[0].due;
    return { expired, moreDue: remaining };
  });
}
export async function submitMembershipApplication(raw: unknown, requestHeaders: Headers) {
  const config = adminConfig();
  if (!config) throw new ApplicationError("Membership applications are currently unavailable. Please try again later.", 503);
  if (requestHeaders.get("origin") !== config.origin || requestHeaders.get("sec-fetch-site") === "cross-site") throw new ApplicationError("This submission is not permitted. Reload the form and try again.", 403);
  if (!(await takeBucket("membership:submit:global", 60, 60))) throw new ApplicationError("Too many applications are being submitted. Please try again shortly.", 429);
  const parsed = submissionInput.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) { const field = String(issue.path[0] ?? "form"); errors[field] ??= field === "careerStage" ? "Choose a career stage from the list." : field === "researchInterests" ? "Select at least one valid research interest, without duplicates." : issue.message; }
    throw new ApplicationError("Check the highlighted fields and try again.", 400, errors);
  }
  const { formToken } = parsed.data;
  const values = applicationInput.parse(Object.fromEntries(Object.entries(parsed.data).filter(([key]) => key !== "formToken" && key !== "website")));
  if (!validApplicationToken(formToken)) throw new ApplicationError("Your form has expired or is invalid. Reload the form and try again.", 400);
  const emailKey = tokenDigest(values.email), ip = process.env.VERCEL ? requestHeaders.get("x-vercel-forwarded-for") : null;
  if (!(await takeBucket(`membership:email:${emailKey}`, 3600, 5)) || (ip && isIP(ip) && !(await takeBucket(`membership:ip:${tokenDigest(ip)}`, 3600, 20)))) throw new ApplicationError("Too many attempts. Please try again in an hour.", 429);
  values.researchInterests.sort();
  const formDigest = tokenDigest(formToken), requestDigest = applicationFingerprint(values);
  const result = await adminDatabase().db.transaction(async tx => {
    await lock(tx);
    await persistExpiry(tx, sql`lower(email)=${values.email}`);
    const [replay] = await tx.select({ requestDigest: membershipApplication.requestDigest }).from(membershipApplication).where(eq(membershipApplication.formDigest, formDigest));
    if (replay) return replay.requestDigest === requestDigest ? { received: true } : { received: false };
    const [active] = await tx.select({ id: membershipApplication.id }).from(membershipApplication).where(and(sql`lower(${membershipApplication.email})=${values.email}`, sql`${membershipApplication.status} in ('pending','approved')`));
    if (active) return { received: false };
    const id = randomUUID();
    await tx.insert(membershipApplication).values({ firstName: values.firstName, lastName: values.lastName, email: values.email, careerStage: values.careerStage, researchInterests: values.researchInterests, why: values.why, id, formDigest, requestDigest, consentedAt: sql`statement_timestamp()`, consentVersion: membershipConsent.version, privacyVersion: membershipConsent.privacyVersion, createdAt: sql`statement_timestamp()`, updatedAt: sql`statement_timestamp()`, expiresAt: sql`statement_timestamp() + interval '720 hours'` });
    await recordEvent(tx, id, "Received membership application");
    await recordMembershipEmails(tx, id, "received");
    return { received: true };
  });
  if (!result.received) throw new ApplicationError("We couldn't accept another application with these details. If you've already applied, please wait for review or contact NOSEE.", 409);
  return { received: true };
}
const effectiveStatus = sql`case when a.status='pending' and a.expires_at<=statement_timestamp() then 'expired' else a.status::text end`;
const pattern = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
export async function listMembershipApplications(actor: Principal, raw: unknown) {
  const query = applicationQuery.parse(raw);
  return adminDatabase().db.transaction(async tx => {
    await requireManagerTransaction(tx, actor); await lock(tx); await persistExpiry(tx);
    const predicates = [sql`true`];
    if (query.q) predicates.push(sql`(a.first_name || ' ' || a.last_name || ' ' || a.email) ilike ${pattern(query.q)}`);
    if (query.status) predicates.push(sql`${effectiveStatus}=${query.status}`);
    const where = sql.join(predicates, sql` and `), total = Number((await tx.execute<{ total: number }>(sql`select count(*)::int total from membership_application a where ${where}`)).rows[0].total), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(query.page, pages);
    const rows = (await tx.execute<Pick<ApplicationRecord, "id" | "firstName" | "lastName" | "email" | "status" | "createdAt" | "expiresAt">>(sql`select a.id,a.first_name "firstName",a.last_name "lastName",a.email,${effectiveStatus} status,a.created_at "createdAt",a.expires_at "expiresAt" from membership_application a where ${where} order by a.created_at desc,a.id desc limit 20 offset ${(page - 1) * 20}`)).rows;
    return { rows: JSON.parse(JSON.stringify(rows)) as typeof rows, total, page, pages };
  });
}
export async function getMembershipApplication(actor: Principal, id: string) {
  return adminDatabase().db.transaction(async tx => {
    await requireManagerTransaction(tx, actor); await lock(tx); await persistExpiry(tx, sql`id=${id}::uuid`);
    const rows = (await tx.execute<ApplicationRecord>(sql`select a.id,a.first_name "firstName",a.last_name "lastName",a.email,a.career_stage "careerStage",a.research_interests "researchInterests",a.why,a.consented_at "consentedAt",a.consent_version "consentVersion",a.privacy_version "privacyVersion",${effectiveStatus} status,a.created_at "createdAt",a.expires_at "expiresAt",a.reviewed_at "reviewedAt",u.name reviewer,a.review_note "reviewNote" from membership_application a left join administrator u on u.id=a.reviewer_id where a.id=${id}::uuid`)).rows;
    return rows[0] ? JSON.parse(JSON.stringify(rows[0])) as ApplicationRecord : null;
  });
}
export async function decideMembershipApplication(actor: Principal, id: string, raw: unknown) {
  const parsed = decisionInput.safeParse(raw);
  if (!parsed.success) throw new ApplicationError("Choose Approve or Reject and enter a review note of 1–2,000 characters.");
  const { decision, note } = parsed.data;
  const outcome = await adminDatabase().db.transaction(async tx => {
    await requireManagerTransaction(tx, actor); await lock(tx);
    const rows = (await tx.execute<{ id: string }>(sql`with instant as materialized (select clock_timestamp() at)
      update membership_application a set status=${decision}::membership_application_status,reviewer_id=${actor.id}::uuid,reviewed_at=instant.at,review_note=${note},updated_at=instant.at
      from instant where a.id=${id}::uuid and a.status='pending' and a.expires_at>instant.at returning a.id`)).rows;
    if (rows.length) { await recordEvent(tx, id, decision === "approved" ? "Approved membership application" : "Rejected membership application", "pending", decision, actor.id); await recordMembershipEmails(tx, id, decision); return "saved"; }
    // Commit expiry even when refusing the decision; throwing inside the transaction would undo it.
    await persistExpiry(tx, sql`id=${id}::uuid`);
    return (await tx.select({ id: membershipApplication.id }).from(membershipApplication).where(eq(membershipApplication.id, id))).length ? "conflict" : "missing";
  });
  if (outcome !== "saved") throw new ApplicationError(outcome === "missing" ? "Application not found." : "This application is no longer pending. It may have expired or already been reviewed.", outcome === "missing" ? 404 : 409);
  return { message: `Application ${decision}. No member record or account was created. Email notifications are processed separately; delivery is not confirmed here.` };
}
