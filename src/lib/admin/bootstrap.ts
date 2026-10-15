import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq, sql } from "drizzle-orm";
import { adminDatabase } from "./database.ts";
import { user, account, auditLog } from "./schema.ts";
import { bootstrapInput } from "./validation.ts";
export async function bootstrapAdministrator(input: unknown) {
  const data = bootstrapInput.parse(input), password = await hashPassword(data.password);
  return adminDatabase().db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(4631001)`);
    const previous = await tx.select({ id: auditLog.id }).from(auditLog).where(eq(auditLog.action, "Initial Super Admin provisioned")).limit(1);
    if (previous.length || (await tx.select({ id: user.id }).from(user).where(eq(user.role, "super_admin")).limit(1)).length) throw new Error("Bootstrap is closed: initial provisioning has already occurred.");
    const id = randomUUID();
    await tx.insert(user).values({ id, name: `${data.firstName} ${data.lastName}`, firstName: data.firstName, lastName: data.lastName, email: data.email, role: "super_admin" });
    await tx.insert(account).values({ id: randomUUID(), userId: id, accountId: id, providerId: "credential", password });
    await tx.insert(auditLog).values({ id: randomUUID(), actorId: id, action: "Initial Super Admin provisioned" });
    return id;
  });
}
