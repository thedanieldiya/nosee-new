import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createElement } from "react";
import { render } from "./helpers/render-site.mjs";
const { ArrowRight } = await import("../src/components/site/ui/ArrowRight.tsx");
const { ButtonLink } = await import("../src/components/site/ui/ButtonLink.tsx");
const { SiteFooter } = await import("../src/components/site/layout/SiteFooter.tsx");
const glyphs = [
  ["core-regular", "arrow-right"], ["core-regular", "arrow-right-up"], ["core-regular", "user-3"],
  ["core-regular", "menu"], ["core-regular", "close"], ["core-regular", "down"],
  ["core-regular", "calendar-2"], ["core-regular", "time"], ["core-regular", "location"], ["core-regular", "search"],
  ...["linkedin", "facebook", "social-x", "instagram", "youtube"].map(name => ["core-filled", name]),
];
test("all chosen icons are official public MingCute exports with inherited paint and decorative semantics", async () => {
  for (const [style, name] of glyphs) {
    const { default: Icon } = await import(`@mingcute/react/${style}/${name}`);
    const html = render(Icon, { size: 16, "aria-hidden": true, focusable: false });
    assert.match(html, /<svg/); assert.match(html, /width="16" height="16"/);
    assert.match(html, /style="color:currentColor"/); assert.match(html, /aria-hidden="true"/); assert.match(html, /focusable="false"/);
    for (const paint of html.matchAll(/(?:fill|stroke)="([^"]+)"/g)) assert.ok(["none", "currentColor"].includes(paint[1]), `${name}: ${paint[1]}`);
    assert.doesNotMatch(html, /<title|role="img"|opacity=|filter=/);
  }
});
test("public source has no obsolete icon assets, custom SVG, masks, filters or second icon pack", () => {
  const root = new URL("../src/", import.meta.url);
  const files = readdirSync(root, { recursive: true }).filter(f => /\.(tsx?|css)$/.test(f));
  for (const file of files) {
    const text = readFileSync(new URL(file, root), "utf8");
    assert.doesNotMatch(text, /\/media\/icons\/|<svg\b|WebkitMask|brightness-0|\binvert\b|lucide|phosphor|tabler/, file);
    if (text.includes("@mingcute/react") && (file.startsWith("components/site/") || file.startsWith("app/(public)/"))) assert.ok(!text.startsWith('"use client"'), `${file}: public icons must stay server-rendered`);
  }
});
test("footer brands retain exact accessible platform names and URLs with control-level colour states", () => {
  const html = render(SiteFooter);
  for (const [label, url] of [["LinkedIn", "linkedin.com"], ["Facebook", "facebook.com"], ["X", "x.com"], ["Instagram", "instagram.com"], ["YouTube", "youtube.com"]]) {
    assert.ok(html.includes(`href="https://${url}" aria-label="${label}" target="_blank" rel="noopener noreferrer"`));
  }
  assert.equal((html.match(/data-ui-icon=/g) ?? []).length, 5);
  assert.match(html, /text-tertiary transition-colors hover:text-inverse focus-visible:text-inverse/);
});
test("disabled and destructive button icons inherit label colour and whole-control opacity", () => {
  const html = render(ButtonLink, { href: "/events", disabled: true, intent: "destructive", variant: "stroke", children: ["Continue", createElement(ArrowRight, { key: "icon" })] });
  assert.match(html, /aria-disabled="true" tabindex="-1"/); assert.doesNotMatch(html, /href=/);
  assert.match(html, /hover:text-red-700 active:border-red-800 active:text-red-800/);
  assert.match(html, /pointer-events-none cursor-not-allowed opacity-50/);
  assert.match(html, /style="color:currentColor"/);
});
