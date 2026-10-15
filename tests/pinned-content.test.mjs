import assert from "node:assert/strict";
import test from "node:test";
import { assertPinned, pinnedHash, fixtures } from "./helpers/pinned-content.mjs";

test("pinned content hashes ignore object key order but detect changed values, types and array order", () => {
  const expected = pinnedHash({ b: [1, null], a: { y: false, x: "title" } });
  assertPinned({ a: { x: "title", y: false }, b: [1, null] }, expected);
  for (const value of [
    { a: { x: "changed", y: false }, b: [1, null] },
    { a: { x: "title", y: false }, b: ["1", null] },
    { a: { x: "title", y: false }, b: [null, 1] },
  ]) assert.throws(() => assertPinned(value, expected), assert.AssertionError);
  for (const value of [{ omitted: undefined }, { number: NaN }, [undefined], { date: new Date("2026-10-14Z") }]) {
    assert.throws(() => pinnedHash(value), assert.AssertionError);
  }
  assert.equal(fixtures.sourceRevision, "9872c4ed12aa48835eab71065c69b468424adb4a");
  assert.equal(fixtures.listing.cases.length, 29);
});
