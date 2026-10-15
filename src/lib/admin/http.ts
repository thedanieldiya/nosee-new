import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { adminDatabase } from "./database.ts";
import { adminConfig } from "./config.ts";
export function privateJson(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", ...extra } });
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === adminConfig()?.origin && request.headers.get("sec-fetch-site") !== "cross-site";
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new Error("Expected JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.length;
    if (length > 8192) { await reader.cancel(); throw new Error("Body too large."); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function takeBucket(key: string, seconds: number, max: number) {
  const rows = await adminDatabase().db.execute<{ count: number }>(sql`
    INSERT INTO admin_login_attempt (key, count, started_at) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN admin_login_attempt.started_at < now() - ${seconds} * interval '1 second' THEN 1 ELSE admin_login_attempt.count + 1 END,
      started_at = CASE WHEN admin_login_attempt.started_at < now() - ${seconds} * interval '1 second' THEN now() ELSE admin_login_attempt.started_at END
    RETURNING count`);
  return rows.rows[0].count <= max;
}
export async function allowSignIn(email: string) {
  const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return await takeBucket("sign-in:global", 60, 60) && await takeBucket(`sign-in:${key}`, 900, 5);
}
