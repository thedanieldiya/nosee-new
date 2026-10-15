import { sql } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, boolean, pgEnum, index, uniqueIndex, bigint, integer, check } from "drizzle-orm/pg-core";

export const adminRole = pgEnum("admin_role", ["super_admin", "editor", "research_group_lead"]);
const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() };
export const user = pgTable("administrator", {
  id: uuid("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false), image: text("image"),
  firstName: text("first_name").notNull(), lastName: text("last_name").notNull(),
  role: adminRole("role").notNull(), researchGroupId: uuid("research_group_id"), active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }), ...timestamps,
}, table => [
  check("administrator_group_scope", sql`(${table.role} = 'research_group_lead' AND ${table.researchGroupId} IS NOT NULL) OR (${table.role} <> 'research_group_lead' AND ${table.researchGroupId} IS NULL)`),
  uniqueIndex("administrator_email_normalized").on(sql`lower(${table.email})`),
]);
export const session = pgTable("admin_session", {
  id: uuid("id").primaryKey(), token: text("token").notNull().unique(), userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ipAddress: text("ip_address"), userAgent: text("user_agent"), ...timestamps,
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
export const auditLog = pgTable("admin_audit_log", { id: uuid("id").primaryKey(), actorId: uuid("actor_id").notNull().references(() => user.id), action: text("action").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, table => [index("admin_audit_actor_time").on(table.actorId, table.createdAt)]);
