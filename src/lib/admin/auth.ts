import "server-only";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { adminConfig } from "./config.ts";
import { adminDatabase } from "./database.ts";
import * as schema from "./schema.ts";
let instance: ReturnType<typeof createAuth> | undefined;
function createAuth(config: NonNullable<ReturnType<typeof adminConfig>>) {
  const { db } = adminDatabase();
  return betterAuth({
    appName: "NOSEE Administration", baseURL: config.origin, basePath: "/api/admin/auth", secret: config.secret,
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }), trustedOrigins: [config.origin],
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 15, maxPasswordLength: 128 },
    session: { expiresIn: 8 * 60 * 60, disableSessionRefresh: true, cookieCache: { enabled: false }, additionalFields: { accessVersion: { type: "number", required: true, defaultValue: 0, input: false } } },
    advanced: { cookiePrefix: "nosee-admin", useSecureCookies: config.secureCookies, database: { generateId: () => randomUUID() }, defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" }, ipAddress: { ipAddressHeaders: process.env.VERCEL ? ["x-vercel-forwarded-for"] : [] } },
    user: { additionalFields: {
      firstName: { type: "string", required: true, input: false }, lastName: { type: "string", required: true, input: false },
      role: { type: ["super_admin", "editor", "research_group_lead"], required: true, input: false },
      researchGroupId: { type: "string", required: false, input: false }, active: { type: "boolean", required: true, input: false },
    } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 100, customRules: { "/sign-in/email": { window: 900, max: 30 } } },
    databaseHooks: { session: { create: { before: async data => {
      const [administrator] = await db.select().from(schema.user).where(eq(schema.user.id, data.userId));
      if (!administrator?.active || (administrator.role === "research_group_lead" && !administrator.researchGroupId)) throw new APIError("UNAUTHORIZED", { message: "Unable to sign in." });
      return { data: { ...data, accessVersion: administrator.accessVersion } };
    }, after: async data => {
      await db.transaction(async tx => {
        await tx.update(schema.user).set({ lastLoginAt: new Date() }).where(eq(schema.user.id, data.userId));
        await tx.insert(schema.auditLog).values({ id: randomUUID(), actorId: data.userId, action: "Signed in" });
      });
    } } } }, logger: { disabled: true },
  });
}
export function adminAuth() {
  const config = adminConfig();
  return config ? instance ??= createAuth(config) : null;
}
