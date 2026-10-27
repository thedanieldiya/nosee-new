import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { render } from "./helpers/render-site.mjs";
registerHooks({ resolve: (specifier, context, nextResolve) => nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context) });
const { eventRecords } = await import("../src/lib/content/events.ts");
const { findEvent } = await import("../src/lib/content/events-detail.ts");
const { presentEvent } = await import("../src/lib/content/events-listing.ts");
const { EventDetail } = await import("../src/components/site/events/EventDetail.tsx");
const { NotFoundContent } = await import("../src/components/site/layout/NotFoundContent.tsx");
const now = new Date("2026-10-14T12:00:00Z");

test("legacy inventory retains exact slugs for the explicit import mapping", () => {
  for (const e of eventRecords) assert.deepEqual(findEvent(e.slug), e);
  for (const slug of ["missing", "ICELLI2026", " icelli2026"]) assert.equal(findEvent(slug), null);
});
test("every regular fixture renders original content with optional sections and no banner", () => {
  for (const e of eventRecords.filter(e => e.type !== "meeting")) {
    const html = render(EventDetail, { event: presentEvent(e, now, true) });
    assert.match(html, /data-event-detail-page=""/);
    assert.match(html, /aria-label="Event people"/);
    assert.equal(html.includes('data-event-itinerary=""'), e.schedule.mode === "multi_day" && e.schedule.itinerary.length > 0);
    assert.equal(html.includes('>REGISTER<'), !!e.registration_url);
    assert.equal(html.includes('id="event-speakers-heading"'), e.speakers.length > 0);
    assert.equal(html.includes('id="event-resources-heading"'), e.resources.length > 0);
    assert.doesNotMatch(html, /hero|banner|dangerouslySetInnerHTML/);
  }
});
test("past deadlines remain on detail while archive presentation omits them", () => {
  const e = findEvent("community-sky-observation-day");
  assert.equal(presentEvent(e, now, true).presentation.application_deadline, "Applications closed");
  assert.equal(presentEvent(e, now).presentation.application_deadline, null);
  assert.match(render(EventDetail, { event: presentEvent(e, now, true) }), /Applications closed/);
});
test("optional itinerary title/end/description and unsafe body remain source-equivalent text", () => {
  const e = { ...findEvent("environmental-data-training"), body: 'First line\n<script>alert("unsafe")</script>', registration_url: "https://example.org/register", resources: [{ label: "Guide", url: "https://example.org/guide" }], speakers: ["First", "Second"], schedule: { mode: "multi_day", start_time: null, end_time: null, itinerary: [{ date: "2027-07-19", start_time: "09:00", end_time: null, title: null, description: "Description only" }, { date: "2027-07-20", start_time: "10:00", end_time: "11:00", title: null, description: null }] } };
  const html = render(EventDetail, { event: presentEvent(e, now, true) });
  assert.match(html, /whitespace-pre-line/); assert.match(html, /&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>|<h3/);
  assert.match(html, /Description only/); assert.match(html, /datetime="09:00"/i);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length, 2);
  assert.ok(html.indexOf('>First<') < html.indexOf('>Second<'));
});
test("shared complete 404 content remains available", () => {
  assert.match(render(NotFoundContent), />Page not found<\/h1>/);
});
// Live metadata, GET/HEAD redirects, encoded/trailing paths and unpublished 404s
// are verified against explicitly imported isolated records in events-integration.mjs.
