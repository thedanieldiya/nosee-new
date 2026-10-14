import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { render } from "./helpers/render-site.mjs";
const { eventRecords } = await import("../src/lib/content/events.ts");
const { findEvent } = await import("../src/lib/content/events-detail.ts");
const { presentEvent } = await import("../src/lib/content/events-listing.ts");
const { EventDetail } = await import("../src/components/site/events/EventDetail.tsx");
const archive = process.argv[2];
assert.ok(archive, "Usage: node tests/compare-event-details.mjs /path/to/isolated/pinned/archive (activate PHP first)");
const instants = ["2026-10-14T12:00:00Z", "2026-09-20T15:59:59.999Z", "2026-09-20T16:00:00Z", "2026-09-26T14:59:59.999Z", "2026-09-26T15:00:00Z", "2026-09-26T18:00:00Z", "2026-09-26T18:00:00.001Z", "2027-07-18T22:59:59.999Z", "2027-07-18T23:00:00Z", "2027-07-23T22:59:59.999Z", "2027-07-23T23:00:00Z"];
const synthetic = { ...findEvent("environmental-data-training"), body: 'First line\n<script>alert("unsafe")</script>', registration_url: "https://example.org/register", resources: [{ label: "Guide", url: "https://example.org/guide" }], speakers: ["First", "Second"], location: { type: "online", venue: null, address: null, city: null, country: null, platform: "Zoom" }, schedule: { mode: "multi_day", start_time: null, end_time: null, itinerary: [{ date: "2027-07-19", start_time: "09:00", end_time: null, title: null, description: "Description only" }, { date: "2027-07-20", start_time: "10:00", end_time: "11:00", title: null, description: null }] } };
const php = spawnSync("php", [new URL("helpers/event-detail-oracle.php", import.meta.url).pathname, archive], { input: JSON.stringify({ instants, synthetic }), encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
assert.equal(php.status, 0, php.stderr);
const oracle = JSON.parse(php.stdout);
assert.deepEqual(eventRecords, oracle.records);
for (const row of oracle.cases) {
  for (const [slug, expected] of Object.entries(row.events)) assert.deepEqual(presentEvent(findEvent(slug), new Date(row.instant), true), expected);
  assert.equal(row.missing, null);
}
assert.deepEqual(presentEvent(synthetic, new Date(instants[0]), true), oracle.synthetic);
const html = render(EventDetail, { event: oracle.synthetic });
for (const markup of [html, oracle.syntheticHtml]) {
  assert.ok(markup.includes('&lt;script&gt;'));
  assert.ok(markup.includes('Description only'));
  assert.ok(!markup.includes('<script>alert'));
}
console.log(`Pinned PHP comparison: 9 exact records; ${instants.length * eventRecords.length} complete detail presentations; ${instants.length} missing lookups; optional/escaped synthetic presentation + Blade markup checks passed.`);
console.log(`Source presentation SHA-256: ${createHash("sha256").update(JSON.stringify(oracle.cases)).digest("hex")}`);
