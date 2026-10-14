import test from "node:test";
import assert from "node:assert/strict";
import { render } from "./helpers/render-site.mjs";
const { buildEvents } = await import("../src/lib/content/events-listing.ts");
const { FeaturedEvent } = await import("../src/components/site/events/FeaturedEvent.tsx");
const { ListingEventCard } = await import("../src/components/site/events/ListingEventCard.tsx");
const { EventMonthHeading } = await import("../src/components/site/events/EventMonthHeading.tsx");
const { default: EventsPage } = await import("../src/app/(public)/events/page.tsx");
const { dynamic: listingDynamic, metadata: listingMetadata } = await import("../src/app/(public)/events/page.tsx");
const { dynamic: archiveDynamic, metadata: archiveMetadata } = await import("../src/app/(public)/events/archive/page.tsx");

test("both routes render dynamically with temporary fixture indexing protection", () => {
  assert.equal(listingDynamic, "force-dynamic"); assert.equal(archiveDynamic, "force-dynamic");
  assert.equal(listingMetadata.title, "Events | NOSEE"); assert.equal(archiveMetadata.title, "Event Archives | NOSEE");
  for (const m of [listingMetadata, archiveMetadata]) assert.deepEqual(m.robots, { index: false, follow: false });
});
test("featured gray placeholder and duplicated meeting preserve new-tab destination and CTA", () => {
  const event = buildEvents(null, new Date("2026-10-14T12:00:00Z")).featured;
  for (const component of [FeaturedEvent, ListingEventCard]) {
    const html = render(component, { event });
    assert.match(html, /href="https:\/\/icelli.nosee.org" target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /Explore International Colloquium/);
    assert.match(html, /arrow-up-right.svg/);
  }
  assert.match(render(FeaturedEvent, { event }), /bg-\[#d9d9d9\]/);
});
test("regular card retains times, local location, deadline and internal same-tab link", () => {
  const e = buildEvents(null, new Date("2026-10-14T12:00:00Z")).upcoming.find(e => e.type === "workshop");
  const html = render(ListingEventCard, { event: e });
  assert.match(html, /CalendarDots.svg/); assert.match(html, /Apply before:/); assert.match(html, /April 7, 2027 at 5:00 PM/);
  assert.match(html, /href="\/events\/earth-observation-data-workshop"/); assert.doesNotMatch(html, /target="_blank"/);
  assert.match(html, /hidden max-w-full lg:inline-flex/);
});
test("month heading remains sticky below compact navbar", () => assert.match(render(EventMonthHeading, { label: "November 2026", id: "event-month-2026-11" }), /sticky top-\[var\(--compact-navbar-offset\)\]/));
test("native GET search escapes/refills query without adding mobile controls", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html = renderToStaticMarkup(await EventsPage({ searchParams: Promise.resolve({ q: '  "><script>alert(1)</script>  ' }) }));
  assert.match(html, /action="\/events" method="GET"/); assert.match(html, /hidden h-12 w-\[416px\]/);
  assert.match(html, /value="&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;"/);
  assert.doesNotMatch(html, /<script>alert/); assert.match(html, /Try a different search term/);
});
test("PHP repeated scalar q uses its last value; bracketed q[] is ignored", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const repeated = renderToStaticMarkup(await EventsPage({ searchParams: Promise.resolve({ q: ["impossible", "  Lagos  "] }) }));
  assert.match(repeated, /value="Lagos"/);
  const array = renderToStaticMarkup(await EventsPage({ searchParams: Promise.resolve({ "q[]": "x" }) }));
  assert.match(array, /value=""/);
});
