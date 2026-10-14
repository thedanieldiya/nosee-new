import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const fixtures = JSON.parse(readFileSync(new URL("../fixtures/public-content.json", import.meta.url)));
// Canonical hashes retain full-record equality without storing repeated PHP exports.
export function pinnedHash(value) {
  const json = JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
  assert.deepEqual(value, JSON.parse(json), "Pinned output must retain JSON values and types");
  return createHash("sha256").update(json).digest("hex");
}
export function assertPinned(value, expected, message) {
  assert.equal(pinnedHash(value), expected, message);
}
