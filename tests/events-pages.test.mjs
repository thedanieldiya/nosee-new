import test from "node:test";
import assert from "node:assert/strict";
import { render } from "./helpers/render-site.mjs";
const { buildEvents } = await import("../src/lib/content/events-listing.ts");
const { FeaturedEvent } = await import("../src/components/site/events/FeaturedEvent.tsx");
const { ListingEventCard } = await import("../src/components/site/events/ListingEventCard.tsx");
const { EventMonthHeading } = await import("../src/components/site/events/EventMonthHeading.tsx");
test("featured gray placeholder and duplicated meeting preserve new-tab destination and CTA", () => {
  const event = buildEvents(null, new Date("2026-10-14T12:00:00Z")).featured;
  for (const component of [FeaturedEvent, ListingEventCard]) {
    const html = render(component, { event });
    assert.match(html, /href="https:\/\/icelli.nosee.org" target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /Explore International Colloquium/);
    assert.match(html, /data-ui-icon="arrow-up-right"/);
  }
  assert.match(render(FeaturedEvent, { event }), /bg-\[#d9d9d9\]/);
});
test("regular card retains times, local location, deadline and internal same-tab link", () => {
  const e = buildEvents(null, new Date("2026-10-14T12:00:00Z")).upcoming.find(e => e.type === "workshop");
  const html = render(ListingEventCard, { event: e });
  assert.match(html, /data-ui-icon="calendar"/); assert.match(html, /Apply before:/); assert.match(html, /April 7, 2027 at 5:00 PM/);
  assert.match(html, /href="\/events\/earth-observation-data-workshop"/); assert.doesNotMatch(html, /target="_blank"/);
  assert.match(html, /hidden max-w-full lg:inline-flex/);
});
test("month heading remains sticky below compact navbar", () => assert.match(render(EventMonthHeading, { label: "November 2026", id: "event-month-2026-11" }), /sticky top-\[var\(--compact-navbar-offset\)\]/));
// Native search, filters, pagination and SSR pages are exercised with published
// database snapshots in events-integration.mjs and check-a08.cjs.
