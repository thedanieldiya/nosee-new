import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, date, boolean, pgEnum, index, uniqueIndex, bigint, integer, check, jsonb } from "drizzle-orm/pg-core";

export const adminRole = pgEnum("admin_role", ["super_admin", "editor", "research_group_lead"]);
const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() };
export const user = pgTable("administrator", {
  id: uuid("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false), image: text("image"),
  firstName: text("first_name").notNull(), lastName: text("last_name").notNull(),
  role: adminRole("role").notNull(), researchGroupId: uuid("research_group_id"), active: boolean("active").notNull().default(true),
  accessVersion: integer("access_version").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }), ...timestamps,
}, table => [
  check("administrator_group_scope", sql`(${table.role} = 'research_group_lead' AND ${table.researchGroupId} IS NOT NULL) OR (${table.role} <> 'research_group_lead' AND ${table.researchGroupId} IS NULL)`),
  uniqueIndex("administrator_email_normalized").on(sql`lower(${table.email})`),
]);
export const session = pgTable("admin_session", {
  id: uuid("id").primaryKey(), token: text("token").notNull().unique(), userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ipAddress: text("ip_address"), userAgent: text("user_agent"), ...timestamps,
  accessVersion: integer("access_version").notNull().default(0),
}, table => [index("admin_session_user").on(table.userId)]);
export const account = pgTable("admin_account", {
  id: uuid("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), password: text("password"),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }), refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }), scope: text("scope"), ...timestamps,
}, table => [uniqueIndex("admin_account_provider").on(table.providerId, table.accountId), index("admin_account_user").on(table.userId)]);
export const verification = pgTable("admin_verification", { id: uuid("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ...timestamps });
export const rateLimit = pgTable("admin_rate_limit", { id: uuid("id").primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(), lastRequest: bigint("last_request", { mode: "number" }).notNull() });
// Atomic account-based throttling also applies when proxy IP headers cannot be trusted.
export const loginAttempt = pgTable("admin_login_attempt", { key: text("key").primaryKey(), count: integer("count").notNull(), startedAt: timestamp("started_at", { withTimezone: true }).notNull() });
export const auditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey(), actorId: uuid("actor_id").references(() => user.id), action: text("action").notNull(),
  targetType: text("target_type"), targetId: uuid("target_id"), targetLabel: text("target_label"),
  changes: jsonb("changes").$type<{ before: { role?: string; active?: boolean; status?: string; memberId?: string | null; profileId?: string | null }; after: { role?: string; active?: boolean; status?: string; memberId?: string | null; profileId?: string | null } }>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("admin_audit_actor_time").on(table.actorId, table.createdAt), index("admin_audit_time").on(table.createdAt, table.id)]);
export const invitation = pgTable("admin_invitation", {
  id: uuid("id").primaryKey(), firstName: text("first_name").notNull(), lastName: text("last_name").notNull(), email: text("email").notNull(),
  role: adminRole("role").notNull(), issuerId: uuid("issuer_id").notNull().references(() => user.id),
  tokenDigest: text("token_digest"), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }), acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  acceptedUserId: uuid("accepted_user_id").references(() => user.id), ...timestamps,
}, table => [
  check("admin_invitation_eligible_role", sql`${table.role} IN ('super_admin', 'editor')`),
  uniqueIndex("admin_invitation_token").on(table.tokenDigest),
  uniqueIndex("admin_invitation_pending_email").on(sql`lower(${table.email})`).where(sql`${table.revokedAt} IS NULL AND ${table.acceptedAt} IS NULL`),
  uniqueIndex("admin_invitation_accepted_user").on(table.acceptedUserId),
]);
export const invitationSend = pgTable("admin_invitation_send", {
  id: uuid("id").primaryKey(), invitationId: uuid("invitation_id").notNull().references(() => invitation.id),
  status: text("status").$type<"sending" | "accepted" | "failed" | "unconfirmed">().notNull(), providerMessageId: text("provider_message_id"),
  ...timestamps,
}, table => [check("admin_invitation_send_status", sql`${table.status} IN ('sending', 'accepted', 'failed', 'unconfirmed')`), index("admin_invitation_send_time").on(table.invitationId, table.createdAt)]);
export const applicationStatus = pgEnum("membership_application_status", ["pending", "approved", "rejected", "expired"]);
export const membershipApplication = pgTable("membership_application", {
  id: uuid("id").primaryKey(), firstName: text("first_name").notNull(), lastName: text("last_name").notNull(), email: text("email").notNull(),
  careerStage: text("career_stage").notNull(), researchInterests: text("research_interests").array().notNull(), why: text("why").notNull(),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(), consentVersion: text("consent_version").notNull(), privacyVersion: text("privacy_version").notNull(),
  status: applicationStatus("status").notNull().default("pending"), formDigest: text("form_digest").notNull().unique(), requestDigest: text("request_digest").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull().default(sql`now() + interval '720 hours'`),
  reviewerId: uuid("reviewer_id").references(() => user.id), reviewedAt: timestamp("reviewed_at", { withTimezone: true }), reviewNote: text("review_note"), ...timestamps,
}, table => [
  uniqueIndex("membership_application_active_email").on(sql`lower(${table.email})`).where(sql`${table.status} IN ('pending','approved')`),
  index("membership_application_expiry").on(table.expiresAt, table.id).where(sql`${table.status} = 'pending'`),
  index("membership_application_created").on(table.createdAt, table.id),
  check("membership_application_decision", sql`(${table.status} IN ('approved','rejected') AND ${table.reviewerId} IS NOT NULL AND ${table.reviewedAt} IS NOT NULL AND ${table.reviewNote} IS NOT NULL AND length(${table.reviewNote}) BETWEEN 1 AND 2000) OR (${table.status} IN ('pending','expired') AND ${table.reviewerId} IS NULL AND ${table.reviewedAt} IS NULL AND ${table.reviewNote} IS NULL)`),
]);
// Empty identity anchor for A10; no CMS, fixture import or public publishing path.
export const leadershipProfileIdentity = pgTable("leadership_profile_identity", {
  id: uuid("id").primaryKey(), displayName: text("display_name").notNull(), roleTitle: text("role_title").notNull(), affiliation: text("affiliation").notNull().default(""), ...timestamps,
});
export const member = pgTable("member", {
  id: uuid("id").primaryKey(), firstName: text("first_name").notNull(), lastName: text("last_name").notNull(), email: text("email").notNull(),
  phone: text("phone").notNull().default(""), affiliation: text("affiliation").notNull().default(""), careerStage: text("career_stage").notNull().default(""),
  researchInterests: text("research_interests").array().notNull().default(sql`'{}'::text[]`), status: text("status").$type<"active" | "inactive">().notNull().default("active"),
  joinDate: date("join_date", { mode: "string" }).notNull(), notes: text("notes").notNull().default(""), version: integer("version").notNull().default(1),
  creationKey: uuid("creation_key").notNull().unique(), creationDigest: text("creation_digest").notNull(),
  leadershipProfileId: uuid("leadership_profile_id").references(() => leadershipProfileIdentity.id).unique(), ...timestamps,
}, table => [uniqueIndex("member_email_normalized").on(sql`lower(${table.email})`), index("member_created").on(table.createdAt, table.id), check("member_status", sql`${table.status} in ('active','inactive')`), check("member_version", sql`${table.version} >= 1`)]);
export const applicationMember = pgTable("membership_application_member", {
  applicationId: uuid("application_id").primaryKey().references(() => membershipApplication.id), memberId: uuid("member_id").notNull().references(() => member.id),
  associatedBy: uuid("associated_by").notNull().references(() => user.id), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("membership_application_member_person").on(table.memberId)]);
