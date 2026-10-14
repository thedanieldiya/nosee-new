import assert from "node:assert/strict";
import test from "node:test";
import { render } from "./helpers/render-site.mjs";
import { fixtures } from "./helpers/pinned-content.mjs";
import { publicationRecords } from "../src/lib/content/publications.ts";
import { newsRecords } from "../src/lib/content/news.ts";
import { eventRecords } from "../src/lib/content/events.ts";

const { HomeResearchOutputs } = await import("../src/components/site/sections/HomeResearchOutputs.tsx");
const { HomeTrendingNews } = await import("../src/components/site/sections/HomeTrendingNews.tsx");
const { HomeUpcomingEvents } = await import("../src/components/site/sections/HomeUpcomingEvents.tsx");
const { TrendingNewsCard } = await import("../src/components/site/cards/TrendingNewsCard.tsx");
const { EventCard } = await import("../src/components/site/cards/EventCard.tsx");
const { default: HomePage, dynamic, metadata } = await import("../src/app/(public)/page.tsx");
const source = {
  publications: { selected: fixtures.homepage.publications.map(slug => publicationRecords.find(record => record.slug === slug)) },
  news: { selected: fixtures.homepage.news.map(slug => newsRecords.find(record => record.slug === slug)) },
  events: { all: eventRecords, selected: fixtures.homepage.events.map(slug => eventRecords.find(record => record.slug === slug)), presentation: fixtures.homepage.presentation },
};

test("research SSR preserves three exact publications, authors/year/area and external DOI controls", () => {
  const html = render(HomeResearchOutputs);
  assert.equal([...html.matchAll(/<article[^>]*data-research-output-card\b/g)].length, 3);
  assert.equal([...html.matchAll(/href="\/publications"/g)].length, 2);
  source.publications.selected.forEach(record => {
    for (const value of [record.title, record.authors.join(", "), `${record.publication_date.slice(0, 4)}, ${record.publication_source}`, record.research_area.replaceAll("-", " ").toUpperCase(), `href="https://doi.org/${record.doi}"`, `aria-label="Read Here: ${record.title}"`]) assert.ok(html.includes(value), value);
  });
  assert.equal([...html.matchAll(/target="_blank" rel="noopener noreferrer"/g)].length, 3);
  assert.doesNotMatch(html, /<script/);
});

test("news SSR preserves featured + three compact cards, full-link labels, sr-only context, dates and image attributes", () => {
  const html = render(HomeTrendingNews);
  assert.match(html, /What’s Trending/);
  assert.equal([...html.matchAll(/data-variant="featured"/g)].length, 1);
  assert.equal([...html.matchAll(/data-variant="compact"/g)].length, 3);
  source.news.selected.forEach(record => {
    for (const value of [`href="/news/${record.slug}"`, record.title, record.excerpt, `alt="${record.image_alt}"`]) assert.ok(html.includes(value), value);
    assert.ok(html.toLowerCase().includes(`datetime="${record.published_at}"`.toLowerCase()));
  });
  assert.equal([...html.matchAll(/width="642" height="642"/g)].length, 4);
  assert.equal([...html.matchAll(/href="\/news"/g)].length, 2);
  assert.match(html, /loading="lazy" decoding="async"/);
  assert.doesNotMatch(html, /aria-label="Read more:|<script/);
  assert.throws(() => render(TrendingNewsCard, { article: source.news.selected[0], variant: "unsupported" }), /Unsupported trending news card variant/);
});

test("event SSR preserves card summaries/date ranges/locations and same-tab links, including meetings and empty selection", () => {
  const html = render(HomeUpcomingEvents, { events: source.events.selected });
  assert.equal([...html.matchAll(/data-event-card/g)].length, 3);
  source.events.selected.forEach(event => {
    const expected = source.events.presentation.find(e => e.slug === event.slug);
    for (const value of [event.title, event.summary, expected.dateLabel, expected.locationLabel, `href="${expected.href}"`]) assert.ok(html.includes(value), value);
  });
  assert.doesNotMatch(html, /target=|<button|<script/);
  const meeting = source.events.all.find(event => event.type === "meeting");
  assert.ok(render(EventCard, { event: meeting }).includes(`href="${meeting.meeting_site_url}"`));
  assert.doesNotMatch(render(HomeUpcomingEvents, { events: [] }), /data-event-card/);
});

test("homepage is server-rendered in five-section source order and evaluated per request, with noindex retained", () => {
  const html = render(HomePage);
  const hooks = ["data-home-hero", "data-monitoring-dashboard-section", "data-research-outputs-section", "data-trending-news-section", "data-upcoming-events-section"];
  const positions = hooks.map(hook => html.indexOf(hook));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.equal(dynamic, "force-dynamic");
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
