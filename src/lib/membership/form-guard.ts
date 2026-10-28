import "server-only";
import {
  createHmac,
  createHash,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { membershipConsent } from "./options.ts";
import { placeholderPrivacyVersion } from "../privacy/content.ts";
function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  return value && value.length >= 32 ? value : null;
}
function sign(value: string, version = 2) {
  const key = secret();
  return key
    ? createHmac("sha256", key)
        .update(`nosee-membership-form-v${version}:${value}`)
        .digest("base64url")
    : null;
}
export function createApplicationToken(
  now = Date.now(),
  privacyVersion: string = placeholderPrivacyVersion,
) {
  if (!/^[a-z0-9-]{1,64}$/.test(privacyVersion)) return "";
  const value = `${randomUUID()}.${now}.${privacyVersion}.${membershipConsent.version}`,
    signature = sign(value);
  return signature ? `${value}.${signature}` : "";
}
export function applicationTokenContext(
  token: string,
  now = Date.now(),
): { privacyVersion: string; consentVersion: string } | null {
  if (token.length > 200) return null;
  const current =
    /^([0-9a-f-]{36})\.(\d{13})\.([a-z0-9-]{1,64})\.([a-z0-9-]{1,40})\.([A-Za-z0-9_-]{43})$/.exec(
      token,
    );
  const legacy = current
    ? null
    : /^([0-9a-f-]{36})\.(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(token);
  const match = current ?? legacy;
  if (!match) return null;
  const issuedAt = Number(match[2]),
    payload = current ? match.slice(1, 5).join(".") : `${match[1]}.${match[2]}`,
    signature = sign(payload, current ? 2 : 1),
    supplied = current ? match[5] : match[3];
  if (
    !signature ||
    issuedAt > now ||
    now - issuedAt >= 2 * 60 * 60 * 1000 ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(supplied))
  )
    return null;
  // Pre-A12 forms showed only this original policy and consent statement.
  return {
    privacyVersion: current ? match[3] : placeholderPrivacyVersion,
    consentVersion: current ? match[4] : "membership-review-v1",
  };
}
export function validApplicationToken(token: string, now = Date.now()) {
  return !!applicationTokenContext(token, now);
}
export const tokenDigest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function applicationFingerprint(value: unknown) {
  const key = secret();
  if (!key) throw new Error("Membership applications are unavailable.");
  return createHmac("sha256", key)
    .update(`nosee-membership-submission-v1:${JSON.stringify(value)}`)
    .digest("hex");
}
