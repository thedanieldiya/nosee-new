import "server-only";
import { eq, sql } from "drizzle-orm";
import { adminDatabase } from "./database.ts";
import { user } from "./schema.ts";
import { ManagementError } from "./errors.ts";
import type { Principal } from "./policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
export async function authorizedPublishing<T>(actor: Principal, work: (tx: ResearchTransaction) => Promise<T>) {
  return adminDatabase().db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(4631002)`);
    const [current] = await tx.select().from(user).where(eq(user.id, actor.id));
    if (!current?.active || current.accessVersion !== actor.accessVersion || !["super_admin", "editor"].includes(current.role)) throw new ManagementError("Current publishing access is required.", 403);
    return work(tx);
  });
}
