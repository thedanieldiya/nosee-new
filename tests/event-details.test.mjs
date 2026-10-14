import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { render } from "./helpers/render-site.mjs";
registerHooks({ resolve: (specifier, context, nextResolve) => nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context) });
const { NextRequest } = await import("next/server.js");
const { proxy } = await import("../src/proxy.ts");
const { eventRecords } = await import("../src/lib/content/events.ts");
const { findEvent } = await import("../src/lib/content/events-detail.ts");
const { presentEvent } = await import("../src/lib/content/events-listing.ts");
const { EventDetail } = await import("../src/components/site/events/EventDetail.tsx");
const { NotFoundContent } = await import("../src/components/site/layout/NotFoundContent.tsx");
const { default: EventPage, generateMetadata, dynamic } = await import("../src/app/(public)/events/[slug]/page.tsx");
const { GET } = await import("../src/app/(public)/events/icelli2026/route.ts");
const now = new Date("2026-10-14T12:00:00Z");

test("exact slug lookup, dynamic detail titles and fixture indexing protection", async () => {
  assert.equal(dynamic, "force-dynamic");
  for (const e of eventRecords) {
    assert.deepEqual(findEvent(e.slug), e);
    assert.deepEqual(await generateMetadata({ params: Promise.resolve({ slug: e.slug }) }), { title: `${e.title} | NOSEE`, robots: { index: false, follow: false } });
  }
  for (const slug of ["missing", "nosee-annual-general-meeting", "ICELLI2026", " icelli2026"]) assert.equal(findEvent(slug), null);
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
test("meeting route returns exact 302 without forwarding query or detail content", async () => {
  for (const query of ["", "?q=test"]) {
    const response = GET(new Request(`https://nosee.example/events/icelli2026${query}`));
    assert.equal(response.status, 302); assert.equal(response.headers.get("location"), "https://icelli.nosee.org");
    assert.equal(await response.text(), "");
  }
});
test("unknown slug takes the real Next not-found path and original 404 content", async () => {
  await assert.rejects(EventPage({ params: Promise.resolve({ slug: "missing" }) }), e => e.digest === "NEXT_HTTP_ERROR_FALLBACK;404");
  assert.match(render(NotFoundContent), /pt-10 pb-16 lg:pt-6/);
  assert.match(render(NotFoundContent), />Page not found<\/h1>/);
});
test("route rewrites preserve unknown 404 and encoded/trailing meeting semantics", () => {
  for (const method of ["GET", "HEAD"]) {
    const response = proxy(new NextRequest("https://nosee.example/events/missing?q=original", { method }));
    assert.equal(response.headers.get("x-middleware-rewrite"), "https://nosee.example/events/missing/__nosee_not_found__?q=original");
  }
  for (const slug of [...eventRecords.map(e => e.slug), "archive"]) {
    assert.equal(proxy(new NextRequest(`https://nosee.example/events/${slug}`)).headers.get("x-middleware-next"), "1");
  }
  assert.equal(proxy(new NextRequest("https://nosee.example/events/missing", { method: "POST" })).headers.get("x-middleware-next"), "1");
  for (const slug of ["%69celli2026", "icelli2026/"]) {
    assert.equal(proxy(new NextRequest(`https://nosee.example/events/${slug}?q=original`)).headers.get("x-middleware-rewrite"), "https://nosee.example/events/icelli2026?q=original");
  }
});
