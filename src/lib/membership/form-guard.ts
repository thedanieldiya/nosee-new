import "server-only";
import { createHmac, createHash, randomUUID, timingSafeEqual } from "node:crypto";
function secret() { const value = process.env.BETTER_AUTH_SECRET; return value && value.length >= 32 ? value : null; }
function sign(value: string) { const key = secret(); return key ? createHmac("sha256", key).update(`nosee-membership-form-v1:${value}`).digest("base64url") : null; }
export function createApplicationToken(now = Date.now()) {
  const value = `${randomUUID()}.${now}`, signature = sign(value);
  return signature ? `${value}.${signature}` : "";
}
export function validApplicationToken(token: string, now = Date.now()) {
  const match = /^([0-9a-f-]{36})\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const issuedAt = Number(match[2]), signature = sign(`${match[1]}.${match[2]}`);
  return !!signature && issuedAt <= now && now - issuedAt < 2 * 60 * 60 * 1000 && timingSafeEqual(Buffer.from(signature), Buffer.from(match[3]));
}
export const tokenDigest = (token: string) => createHash("sha256").update(token).digest("hex");
export function applicationFingerprint(value: unknown) {
  const key = secret();
  if (!key) throw new Error("Membership applications are unavailable.");
  return createHmac("sha256", key).update(`nosee-membership-submission-v1:${JSON.stringify(value)}`).digest("hex");
}
