import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { render } from "./helpers/render-site.mjs";
import { about } from "../src/lib/content/about.ts";

const { default: AboutPage, metadata } = await import("../src/app/(public)/about/page.tsx");
const { buttonClasses } = await import("../src/components/site/ui/ButtonLink.tsx");
const { ArrowRight } = await import("../src/components/site/ui/ArrowRight.tsx");
const { SiteNavigation } = await import("../src/components/site/layout/SiteNavigation.tsx");
const { navigation, getNavigationState } = await import("../src/lib/content/navigation.ts");
const source = JSON.parse(readFileSync(new URL("../docs/evidence/task-07/source-data.json", import.meta.url)));
const assets = JSON.parse(readFileSync(new URL("../docs/evidence/task-07/assets.json", import.meta.url)));
const html = render(AboutPage);

test("complete literal About record matches fresh pinned PHP, including all responsive/development copy", () => {
  assert.deepEqual(about, source);
  assert.equal(about.mission.objectives.length, 3);
  assert.equal(about.leadership.people.length, 7);
  assert.equal(new Set([about.intro.description_mobile, about.intro.description_tablet, about.intro.description]).size, 3);
  assert.equal(new Set([about.mission.statement_mobile, about.mission.statement_tablet, about.mission.statement]).size, 3);
  assert.equal(about.quote.attribution, "John Doe");
});

test("six source PNG hashes, dimensions and paths match and reused profiles add no assets", () => {
  assert.equal(assets.length, 6);
  assert.equal(assets.reduce((sum, asset) => sum + asset.bytes, 0), 1481578);
  for (const asset of assets) {
    const bytes = readFileSync(new URL(`../public${asset.path}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sourceSha256);
    assert.equal(asset.targetSha256, asset.sourceSha256);
    assert.equal(bytes.length, asset.bytes);
    assert.equal(bytes.readUInt32BE(16), asset.width);
    assert.equal(bytes.readUInt32BE(20), asset.height);
  }
  assert.equal(new Set(about.leadership.people.map(profile => profile.image)).size, 3);
});

test("actual SSR route retains every section, picture variants, order, offset, image attributes and publishing protection", () => {
  assert.equal(metadata.title, "About NOSEE | NOSEE");
  assert.deepEqual(metadata.robots, { index: false, follow: false });
  assert.match(html, /^<div class="pt-\[var\(--expanded-navbar-offset\)\]">/);
  assert.match(html, /data-about-page/);
  const positions = ["About NOSEE", 'id="mission"', "<blockquote", 'id="story-heading"', 'id="leadership"', 'id="collaborations"'].map(text => html.indexOf(text));
  assert.ok(positions.every((value, index) => value >= 0 && (index === 0 || value > positions[index - 1])));
  assert.equal((html.match(/<figure\b/g) ?? []).length, 7);
  assert.equal((html.match(/data-profile-indicator=""/g) ?? []).length, 7);
  assert.match(html, /media="\(min-width: 1280px\)" srcSet="\/media\/about\/earth-space-environment.png"/);
  assert.match(html, /media="\(min-width: 1024px\)" srcSet="\/media\/about\/earth-space-environment-tablet.png"/);
  assert.match(html, /width="370" height="260" fetchPriority="high"/);
  assert.match(html, /width="752" height="500" loading="lazy"/);
  assert.match(html, /motion-reduce:transition-none/);
  for (const description of [about.intro.description_mobile, about.intro.description_tablet, about.intro.description, about.mission.statement_mobile, about.mission.statement_tablet, about.mission.statement, about.story.body]) assert.ok(html.includes(description));
  assert.match(html, /lg:col-span-8 xl:col-span-4/);
  assert.match(html, /lg:grid-cols-\[21.5625rem_1fr\]/);
});

test("original collaboration URLs, navigation anchor labels and inactive/current rules remain literal", () => {
  assert.deepEqual(about.collaboration.actions.map(action => [action.label, action.url]), [["Participate", "/participate"], ["Partner with NOSEE", "/partnerships"], ["Support NOSEE", "/support"]]);
  for (const action of about.collaboration.actions) assert.ok(html.includes(`href="${action.url}"`));
  assert.deepEqual(navigation.primary[0].children.map(item => [item.label, item.url]), [["Mission", "/about#mission"], ["Leadership", "/about#leadership"], ["Collaborations", "/about#collaborations"]]);
  const state = getNavigationState("/about");
  assert.equal(state.homeCurrent, false);
  assert.equal(state.primary[0].label, "About NSEE");
  assert.equal(state.primary[0].current, true);
  assert.ok(state.primary[0].children.every(item => item.current));
});

test("source icon-only API extensions preserve existing default primitive output", () => {
  assert.ok(buttonClasses({ size: "sm", iconOnly: true, intent: "secondary", variant: "text" }).includes("h-9 w-9 p-0 text-sm"));
  assert.ok(buttonClasses({ size: "sm" }).includes("h-9 px-3 text-sm"));
  assert.match(render(ArrowRight), /class="inline-block size-4 shrink-0"/);
  assert.match(render(ArrowRight), /data-ui-icon="arrow-right"/);
  assert.match(render(ArrowRight), /style="color:currentColor"/);
  assert.match(render(ArrowRight, { className: "rotate-180" }), /shrink-0 rotate-180/);
});

test("actual navigation SSR highlights About and all original fragment links before hydration", () => {
  const Navigation = () => createElement(PathnameContext.Provider, { value: "/about" }, createElement(SiteNavigation));
  const markup = render(Navigation);
  for (const url of ["/about", "/about#mission", "/about#leadership", "/about#collaborations"]) {
    assert.ok(markup.includes(`href="${url}" aria-current="page"`));
  }
  assert.equal((markup.match(/href="\/" aria-current="page"/g) ?? []).length, 0);
  assert.match(markup, /data-navigation-active-url="\/about" data-mobile-active-submenu=""/);
});

test("actual homepage navigation SSR retains home current state and inactive About links", () => {
  const Navigation = () => createElement(PathnameContext.Provider, { value: "/" }, createElement(SiteNavigation));
  const markup = render(Navigation);
  assert.equal((markup.match(/href="\/" aria-current="page"/g) ?? []).length, 2);
  assert.equal((markup.match(/href="\/about" aria-current="page"/g) ?? []).length, 0);
  assert.equal((markup.match(/data-mobile-active-submenu/g) ?? []).length, 0);
});
