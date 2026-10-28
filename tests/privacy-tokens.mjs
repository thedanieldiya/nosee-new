import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID, randomBytes } from "node:crypto";
import {
  createApplicationToken,
  applicationTokenContext,
  validApplicationToken,
} from "../src/lib/membership/form-guard.ts";
const original = process.env.BETTER_AUTH_SECRET;
process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
test.after(() => {
  if (original === undefined) delete process.env.BETTER_AUTH_SECRET;
  else process.env.BETTER_AUTH_SECRET = original;
});
test("new signed form tokens bind the exact policy and consent versions within the existing time and size limits", () => {
  const now = Date.now(),
    version = "privacy-" + randomUUID(),
    token = createApplicationToken(now, version);
  assert.ok(token.length <= 200);
  assert.deepEqual(applicationTokenContext(token, now), {
    privacyVersion: version,
    consentVersion: "membership-review-v1",
  });
  assert.equal(validApplicationToken(token, now + 7199999), true);
  assert.equal(validApplicationToken(token, now + 7200000), false);
  assert.equal(validApplicationToken(token, now - 1), false);
});
test("modified policy, consent, signature and malformed tokens fail closed", () => {
  const token = createApplicationToken();
  for (const t of [
    token.replace("development-placeholder-v1", "privacy-" + randomUUID()),
    token.replace("membership-review-v1", "membership-review-v2"),
    token.slice(0, -1) + "!",
    "x".repeat(201),
    "",
  ])
    assert.equal(applicationTokenContext(t), null);
  assert.equal(createApplicationToken(Date.now(), "https://evil.invalid"), "");
});
test("still-valid pre-A12 tokens map only to the original displayed wording, never a new policy", () => {
  const now = Date.now(),
    value = randomUUID() + "." + now,
    signature = createHmac("sha256", process.env.BETTER_AUTH_SECRET)
      .update("nosee-membership-form-v1:" + value)
      .digest("base64url");
  assert.deepEqual(applicationTokenContext(value + "." + signature, now), {
    privacyVersion: "development-placeholder-v1",
    consentVersion: "membership-review-v1",
  });
});
test("missing signing configuration never creates or accepts a token", () => {
  const secret = process.env.BETTER_AUTH_SECRET,
    token = createApplicationToken();
  delete process.env.BETTER_AUTH_SECRET;
  try {
    assert.equal(createApplicationToken(), "");
    assert.equal(validApplicationToken(token), false);
  } finally {
    process.env.BETTER_AUTH_SECRET = secret;
  }
});
