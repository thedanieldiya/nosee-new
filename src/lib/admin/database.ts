import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";
import { safePostgresUrl } from "./environment.ts";
let database: ReturnType<typeof connect> | undefined;
function connect() {
  if (!process.env.DATABASE_URL || !safePostgresUrl(process.env.DATABASE_URL)) throw new Error("Administrator database is not configured.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000, statement_timeout: 5000, allowExitOnIdle: true });
  pool.on("error", () => console.error("Administrator database connection unavailable."));
  return { db: drizzle(pool, { schema }), pool };
}
export function adminDatabase() { return database ??= connect(); }
