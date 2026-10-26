import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import "./helpers/render-site.mjs";
import { publicationRecords } from "../src/lib/content/publications.ts";
import { newsRecords } from "../src/lib/content/news.ts";
import { eventRecords } from "../src/lib/content/events.ts";
import { fixtures, assertPinned } from "./helpers/pinned-content.mjs";

const { selectFeaturedPublications, selectTrendingNews, selectFeaturedUpcoming, utcToday, newsDateLabel, newsCategoryLabel, eventCardValues } = await import("../src/lib/content/homepage-selections.ts");
const source = fixtures.homepage;
const slugs = records => records.map(record => record.slug);

test("all publication/news/event records and current selections equal pinned PHP fixtures", () => {
  assertPinned(publicationRecords, source.publicationsHash);
  assertPinned(newsRecords, source.newsHash);
  assertPinned(eventRecords, source.eventsHash);
  assert.deepEqual(slugs(selectFeaturedPublications()), source.publications);
  assert.deepEqual(slugs(selectTrendingNews(newsRecords)), source.news);
  assert.deepEqual(slugs(selectFeaturedUpcoming(eventRecords, source.asOf)), source.events);
  assertPinned(selectFeaturedPublications(), source.publicationsSelectedHash);
  assertPinned(selectTrendingNews(newsRecords), source.newsSelectedHash);
  assertPinned(selectFeaturedUpcoming(eventRecords, source.asOf), source.eventsSelectedHash);
  assert.deepEqual([publicationRecords.length, newsRecords.length, eventRecords.length], [10, 9, 9]);
});

test("research filters strict true, sorts newest/slug ties, respects limits and does not mutate input", () => {
  const base = publicationRecords[0];
  const input = [
    { ...base, slug: "z", featured: true, publication_date: "2026-06-01" },
    { ...base, slug: "b", featured: true, publication_date: "2026-07-01" },
    { ...base, slug: "a", featured: true, publication_date: "2026-07-01" },
    { ...base, slug: "excluded", featured: "true", publication_date: "2027-01-01" },
  ];
  const before = structuredClone(input);
  assert.deepEqual(slugs(selectFeaturedPublications(input)), ["a", "b", "z"]);
  assert.deepEqual(slugs(selectFeaturedPublications(input, 1)), ["a"]);
  assert.deepEqual(selectFeaturedPublications(input, 0), []);
  assert.deepEqual(selectFeaturedPublications(input, -1), []);
  assert.deepEqual(input, before);
});

test("news uses strict featured ranking, raw ISO string order rather than instant order, and slug ties", () => {
  const base = newsRecords[0];
  const input = [
    { ...base, slug: "featured", featured: true, published_at: "2020-01-01T00:00:00+00:00" },
    { ...base, slug: "b", featured: false, published_at: "2026-07-28T18:00:00+02:00" },
    { ...base, slug: "a", featured: false, published_at: "2026-07-28T18:00:00+02:00" },
    { ...base, slug: "later-instant", featured: "true", published_at: "2026-07-28T17:00:00-03:00" },
  ];
  const before = structuredClone(input);
  assert.deepEqual(slugs(selectTrendingNews(input)), ["featured", "a", "b", "later-instant"]);
  assert.deepEqual(selectTrendingNews(input, 0), []);
  assert.deepEqual(selectTrendingNews(input, -1), []);
  assert.deepEqual(input, before);
});

test("upcoming events match injected-date PHP predicate/comparator at ongoing, end-day and past boundaries", () => {
  for (const boundary of source.boundaries) {
    assert.deepEqual(slugs(selectFeaturedUpcoming(eventRecords, boundary.today)), boundary.selected);
    assertPinned(selectFeaturedUpcoming(eventRecords, boundary.today), boundary.selectedHash);
  }
  assert.equal(selectFeaturedUpcoming(eventRecords, "2027-03-12")[0].slug, "regional-space-weather-conference");
  assert.equal(selectFeaturedUpcoming(eventRecords, "2027-03-13").length, 2);
  assert.deepEqual(selectFeaturedUpcoming(eventRecords, "2027-05-15"), []);
});

test("UTC midnight, not Lagos calendar day, removes a past event; strict flags, start-only and slug ties hold", () => {
  const before = utcToday(new Date("2027-03-13T00:30:00+01:00"));
  const after = utcToday(new Date("2027-03-13T01:00:00+01:00"));
  assert.equal(before, "2027-03-12"); assert.equal(after, "2027-03-13");
  assert.ok(slugs(selectFeaturedUpcoming(eventRecords, before)).includes("regional-space-weather-conference"));
  assert.ok(!slugs(selectFeaturedUpcoming(eventRecords, after)).includes("regional-space-weather-conference"));
  const base = eventRecords[0];
  const input = [
    { ...base, slug: "b", start_date: "2027-05-14", end_date: null, featured: true },
    { ...base, slug: "a", start_date: "2027-05-14", end_date: null, featured: true },
    { ...base, slug: "excluded", start_date: "2027-05-14", end_date: null, featured: "true" },
  ];
  const original = structuredClone(input);
  assert.deepEqual(slugs(selectFeaturedUpcoming(input, "2027-05-14")), ["a", "b"]);
  assert.deepEqual(selectFeaturedUpcoming(input, "2027-05-15"), []);
  assert.deepEqual(selectFeaturedUpcoming(input, "2027-05-14", 0), []);
  assert.deepEqual(input, original);
});

test("news labels use the editorial zone with WAT fallback and preserve category title case", () => {
  for (const label of source.dateLabels) assert.equal(newsDateLabel(newsRecords.find(a => a.slug === label.slug).published_at), label.date);
  assert.equal(newsDateLabel("2026-12-31T23:30:00-08:00"), "01/01/2027");
  assert.equal(newsDateLabel("2027-01-01T00:30:00+14:00"), "31/12/2026");
  assert.equal(newsDateLabel("2026-12-31T23:30:00Z", "UTC"), "31/12/2026");
  assert.equal(newsCategoryLabel("organisation-news"), "Organisation News");
});

test("all event date, type, same-tab meeting URL and physical/hybrid/online location transforms equal PHP", () => {
  for (const expected of source.presentation) {
    const { slug, ...values } = expected;
    assert.deepEqual(eventCardValues(eventRecords.find(e => e.slug === slug)), values);
  }
  assert.equal(eventCardValues(eventRecords.find(e => e.type === "meeting")).href, "https://icelli.nosee.org");
});

test("three original news PNG hashes/dimensions match, with the fourth article reusing image two", () => {
  const assets = source.assets;
  for (const asset of assets.filter(a => a.dimensions)) {
    const bytes = readFileSync(new URL("../" + asset.path, import.meta.url));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
    if (asset.dimensions) assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], asset.dimensions);
  }
  assert.equal(assets.filter(a => a.dimensions).reduce((sum, a) => sum + a.bytes, 0), 547673);
  assert.equal(selectTrendingNews(newsRecords)[3].image, "/media/trending/trending2.png");
});
