import "server-only";
import { headers } from "next/headers";
import { redirect, forbidden } from "next/navigation";
import { eq } from "drizzle-orm";
import { adminAuth } from "./auth.ts";
import { adminDatabase } from "./database.ts";
import { user } from "./schema.ts";
import { canAccess, type Permission, type Principal } from "./policy.ts";
export async function administrator(requestHeaders: Headers): Promise<Principal | null> {
  const auth = adminAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
  if (!session) return null;
  // Always re-read authority; role/scope/deactivation changes take effect immediately.
  const [record] = await adminDatabase().db.select().from(user).where(eq(user.id, session.user.id));
  if (!record?.active || session.session.accessVersion !== record.accessVersion || (record.role === "research_group_lead" && !record.researchGroupId)) return null;
  return { id: record.id, firstName: record.firstName, lastName: record.lastName, email: record.email, role: record.role, researchGroupId: record.researchGroupId, accessVersion: record.accessVersion };
}
export async function requireAdministrator() {
  let principal: Principal | null = null;
  try { principal = await administrator(await headers()); } catch { /* Fail closed without exposing connection details. */ }
  if (!principal) redirect("/admin/sign-in");
  return principal;
}
export async function requirePermission(permission: Permission, groupId?: string) {
  const principal = await requireAdministrator();
  if (!canAccess(principal, permission, groupId)) forbidden();
  return principal;
}
