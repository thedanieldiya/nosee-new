import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.ts";
import { verifiedPostgresUrl } from "./environment.ts";
let database: ReturnType<typeof connect> | undefined;
function connect() {
  const connectionString = verifiedPostgresUrl(process.env.DATABASE_URL ?? "");
  if (!connectionString) throw new Error("Administrator database is not configured.");
  const pool = new Pool({ connectionString, max: 3, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000, statement_timeout: 5000, allowExitOnIdle: true });
  pool.on("error", () => console.error("Administrator database connection unavailable."));
  return { db: drizzle(pool, { schema }), pool };
}
export function adminDatabase() { return database ??= connect(); }
