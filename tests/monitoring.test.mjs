import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import ts from "typescript";
import { dataRecords, homepageMonitoringRecords } from "../src/lib/content/monitoring.ts";
import { fixtures } from "./helpers/pinned-content.mjs";

// Reuse installed TypeScript to render the real server components without a test framework.
const sourceRoot = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = new URL(specifier.slice(2), sourceRoot);
      const url = [".tsx", ".ts"].map(extension => new URL(base.href + extension)).find(existsSync);
      return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot.href) && url.endsWith(".tsx")) {
      return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});
const { HomeMonitoringDashboard } = await import("../src/components/site/sections/HomeMonitoringDashboard.tsx");
const source = { all: fixtures.monitoring.all, monitoring: fixtures.monitoring.selected.map(slug => fixtures.monitoring.all.find(record => record.slug === slug)) };

test("literal data and strict homepage selection match the pinned PHP repository, excluding the starter", () => {
  assert.deepEqual(dataRecords, source.all);
  assert.deepEqual(homepageMonitoringRecords, source.monitoring);
  assert.deepEqual(homepageMonitoringRecords.map(record => record.slug), [
    "average-f-region-observations", "range-error-from-tec", "tec-difference-from-30-day-median",
  ]);
  assert.equal(dataRecords.length, 4);
  assert.equal(dataRecords.find(record => record.slug === "starter-environmental-dataset").homepage_monitoring, false);
  assert.ok(homepageMonitoringRecords.every(record => record.homepage_monitoring === true));
});

test("server HTML contains the three exact cards, original images, safe external links and both source CTA variants", () => {
  const html = renderToStaticMarkup(createElement(HomeMonitoringDashboard));
  assert.match(html, /<section[^>]*aria-labelledby="monitoring-dashboard-heading"/);
  assert.match(html, /<h2[^>]*id="monitoring-dashboard-heading"[^>]*>EARTH-SPACE ENVIRONMENT MONITORING DASHBOARD<\/h2>/);
  assert.equal([...html.matchAll(/<article[^>]*data-monitoring-dashboard-card/g)].length, 3);
  assert.deepEqual([...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(match => match[1]), source.monitoring.map(record => record.title));
  assert.doesNotMatch(html, /Starter Environmental Dataset|<script|opacity-0/);
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(match => match[0]);
  const externalLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map(match => match[0]);
  assert.equal(images.length, 3);
  assert.equal(externalLinks.length, 3);
  source.monitoring.forEach((record, index) => {
    for (const attribute of [`src="${record.image}"`, `alt="${record.image_alt}"`, 'width="600"', 'height="338"']) assert.ok(images[index].includes(attribute));
    assert.match(images[index], /loading="lazy" decoding="async"/);
    for (const attribute of [`href="${record.source_url}"`, 'rel="noopener noreferrer"', `aria-label="View full product: ${record.title}"`]) assert.ok(externalLinks[index].includes(attribute));
  });
  assert.equal([...html.matchAll(/Provided by: National Weather Services/g)].length, 3);
  assert.match(html, /href="\/data"[^>]*>SEE ALL DATA<\/a>/);
  assert.match(html, /href="\/data"[^>]*>ALL DATA<\/a>/);
});

test("all monitoring PNGs retain pinned hashes, byte lengths and natural dimensions", () => {
  const assets = fixtures.monitoring.assets;
  for (const asset of assets) {
    const bytes = readFileSync(new URL("../" + asset.path, import.meta.url));
    assert.equal(bytes.length, asset.bytes);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [600, 338]);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
  }
  assert.equal(assets.reduce((sum, asset) => sum + asset.bytes, 0), 603892);
});
