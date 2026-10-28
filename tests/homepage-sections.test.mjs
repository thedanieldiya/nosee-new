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

test("research SSR preserves the card design and metadata with internal publication links", () => {
  const html = render(HomeResearchOutputs, {records:source.publications.selected});
  assert.equal([...html.matchAll(/<article[^>]*data-research-output-card\b/g)].length, 3);
  assert.equal([...html.matchAll(/href="\/publications"/g)].length, 2);
  source.publications.selected.forEach(record => {
    for (const value of [record.title, record.authors.join(", "), `${record.publication_date.slice(0, 4)}, ${record.publication_source}`, record.research_area.replaceAll("-", " ").toUpperCase(), `href="/publications/${record.slug}"`, `aria-label="View publication: ${record.title}"`]) assert.ok(html.includes(value), value);
  });
  assert.doesNotMatch(html, /target="_blank"/);
  assert.doesNotMatch(html, /<script/);
});

test("news SSR preserves featured + three compact cards, article links, sr-only context, dates and image attributes", () => {
  const html = render(HomeTrendingNews, {articles:source.news.selected});
  assert.match(html, /What’s Trending/);
  assert.equal([...html.matchAll(/data-variant="featured"/g)].length, 1);
  assert.equal([...html.matchAll(/data-variant="compact"/g)].length, 3);
  source.news.selected.forEach(record => {
    for (const value of [record.title, record.excerpt, `alt="${record.image_alt}"`]) assert.ok(html.includes(value), value);
    assert.ok(html.toLowerCase().includes(`datetime="${record.published_at}"`.toLowerCase()));
  });
  assert.equal([...html.matchAll(/width="642" height="642"/g)].length, 4);
  for(const record of source.news.selected) assert.ok(html.includes(`href="/news/${record.slug}"`));
  assert.match(html, /href="\/news"/);
  assert.match(html, /View all news/);
  assert.equal(render(HomeTrendingNews, {articles:[]}), "");
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

test("homepage remains server-rendered per request with noindex and hides empty live news and never restores event fixtures", async () => {
  const original = process.env.DATABASE_URL; delete process.env.DATABASE_URL;
  let element; try { element = await HomePage(); } finally { if (original !== undefined) process.env.DATABASE_URL = original; }
  const html = render(() => element);
  assert.equal(html.includes("data-trending-news-section"), false);
  assert.equal(html.includes("data-event-card"), false);
  assert.doesNotMatch(html, /<article[^>]*data-research-output-card\b/);
  const hooks = ["data-home-hero", "data-monitoring-dashboard-section", "data-research-outputs-section", "data-upcoming-events-section"];
  const positions = hooks.map(hook => html.indexOf(hook));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.equal(dynamic, "force-dynamic");
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
