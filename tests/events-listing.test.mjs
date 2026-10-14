import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "./helpers/render-site.mjs";
import { approvedBadgeContrast } from "./helpers/public-hardening-exceptions.mjs";
const { eventRecords } = await import("../src/lib/content/events.ts");
const { buildEvents, archiveEvents, eventState, presentEvent, normalizeEventQuery } = await import("../src/lib/content/events-listing.ts");

const evidence = new URL("../docs/evidence/task-08/", import.meta.url);
const source = JSON.parse(readFileSync(new URL("source-oracle.json", evidence)));
const inputs = JSON.parse(readFileSync(new URL("oracle-input.json", evidence)));

test("all nine literal records remain exactly equal to the pinned PHP repository", () => assert.deepEqual(eventRecords, source.records));
for (const expected of source.cases) {
  test(`complete PHP presentation, listing and archive oracle: ${expected.name}`, () => {
    const input = inputs.find(c => c.name === expected.name), now = new Date(input.instant), records = input.records ?? eventRecords;
    assert.deepEqual(records.map(e => presentEvent(e, now)), approvedBadgeContrast(expected.present));
    assert.deepEqual(buildEvents(input.query, now, records), approvedBadgeContrast(expected.build));
    assert.deepEqual(archiveEvents(now, records), approvedBadgeContrast(expected.archive));
  });
}
test("baseline fallback featured is duplicated, and search affects only upcoming", () => {
  const now = new Date("2026-10-14T12:00:00Z"), baseline = buildEvents(null, now), empty = buildEvents("impossible-no-match", now);
  assert.equal(baseline.featured.slug, "icelli2026");
  assert.equal(baseline.featured.featured, false);
  assert.equal(baseline.featured.image, null);
  assert.equal(baseline.upcoming[0].slug, baseline.featured.slug);
  assert.deepEqual(empty.featured, baseline.featured);
  assert.deepEqual(empty.ongoing, baseline.ongoing);
  assert.deepEqual(empty.upcoming_groups, []);
});
test("search excludes slug, body, speakers, dates and URLs; uses PHP ASCII trim/case", () => {
  const event = { ...eventRecords[0], slug: "slug-secret", body: "body-secret", speakers: ["speaker-secret"] }, now = new Date("2026-01-01Z");
  for (const q of ["slug-secret", "body-secret", "speaker-secret", "2027-05-14"]) assert.equal(buildEvents(q, now, [event]).upcoming.length, 0);
  assert.equal(buildEvents("  LaBoRaToRy\t", now, [event]).upcoming.length, 1);
  assert.equal(normalizeEventQuery(["Lagos"]), null);
  assert.equal(normalizeEventQuery(" \t\r\n\0"), null);
  assert.equal(normalizeEventQuery("\u00a0"), "\u00a0");
  assert.equal(normalizeEventQuery("\f"), "\f");
});
test("single-day exact instants and local end-of-day are inclusive", () => {
  const event = { ...eventRecords[0], start_date: "2026-10-14" };
  for (const [instant, expected] of [["2026-10-14T08:59:59.999Z", "upcoming"], ["2026-10-14T09:00:00Z", "ongoing"], ["2026-10-14T11:00:00Z", "ongoing"], ["2026-10-14T11:00:00.001Z", "past"]]) assert.equal(eventState(event, new Date(instant)), expected);
  const open = { ...event, schedule: { ...event.schedule, end_time: null } };
  assert.equal(eventState(open, new Date("2026-10-14T22:59:59.999Z")), "ongoing");
  assert.equal(eventState(open, new Date("2026-10-14T23:00:00Z")), "past");
});
test("deadline equality closes applications; past archives omit even future deadlines", () => {
  const event = eventRecords.find(e => e.slug === "earth-observation-data-workshop");
  assert.equal(presentEvent(event, new Date(event.application_deadline)).presentation.application_deadline, "Applications closed");
  assert.equal(presentEvent({ ...event, application_deadline: "2030-01-01T00:00:00Z" }, new Date("2028-01-01Z")).presentation.application_deadline, null);
});
