import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import { readFileSync, writeFileSync } from "node:fs";
import "./helpers/render-site.mjs";
const { eventRecords } = await import("../src/lib/content/events.ts");
const { presentEvent } = await import("../src/lib/content/events-listing.ts");
const base = process.argv[2];
const reference = process.argv[3]?.startsWith("http") ? process.argv[3] : null;
const clock = process.argv.find(a => a.startsWith("--clock="))?.slice(8);
assert.ok(base, "Usage: node tests/check-event-routes.mjs TARGET [REFERENCE] [--clock=/path/to/test-clock]");
// Native HTTP also handles the pinned PHP server's redirect connection framing.
async function requestHttp(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith("https:") ? https : http).request(url, { method }, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location ?? null, html: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject); req.end();
  });
}
const initial = clock ? readFileSync(clock, "utf8") : null;
const report = { requests: 0, comparisons: 0, rollover: [], routes: [], deviations: [] };
async function request(path, expectedStatus, method = "GET") {
  const response = await requestHttp(base + path, method);
  const html = response.html;
  report.requests++;
  assert.equal(response.status, expectedStatus, path);
  if (expectedStatus === 302) {
    assert.equal(response.location, "https://icelli.nosee.org");
    assert.ok(!html.includes("data-event-detail-page"));
  } else {
    assert.equal((html.match(/id="main-content"/g) ?? []).length, 1, `${path}: one SSR main`);
    assert.equal((html.split("</main>")[1]?.split("</footer>")[0]?.match(/data-site-footer/g) ?? []).length, 1, `${path}: one SSR footer`);
    if (expectedStatus === 404) {
      assert.ok(html.includes(">Page not found</h1>"));
      assert.ok(html.includes("<title>Page not found — NOSEE</title>"));
    }
  }
  if (reference) {
    const source = await requestHttp(reference + path, method);
    assert.equal(response.status, source.status, path);
    assert.equal(response.location, source.location, path);
    if (expectedStatus !== 302) {
      assert.equal(html.match(/<title>(.*?)<\/title>/s)?.[1], source.html.match(/<title>(.*?)<\/title>/s)?.[1], path);
      assert.equal(html.match(/data-event-state="(.*?)"/)?.[1], source.html.match(/data-event-state="(.*?)"/)?.[1], path);
      if (clock && expectedStatus === 200 && html.includes("data-event-detail-page")) {
        const record = eventRecords.find(e => path.replace(/\/$/, "") === `/events/${e.slug}`);
        const deadline = presentEvent(record, new Date(readFileSync(clock, "utf8")), true).presentation.application_deadline;
        if (deadline) assert.ok(source.html.includes(deadline), `${path}: source deadline`);
      }
    }
    report.comparisons++;
  }
  return html;
}
try {
  // The original public utility navbar still uses /login. It must open the
  // administrator login, not the old source's missing public page.
  for (const path of ["/login", "/login?next=https://example.invalid"]) {
    const response = await requestHttp(base + path);
    assert.equal(response.status, 307, path);
    assert.ok(response.location, `${path}: redirect location`);
    assert.equal(new URL(response.location, base).pathname, "/admin/sign-in", path);
    report.requests++;
  }
  for (const e of eventRecords) {
    const html = await request(`/events/${e.slug}`, e.type === "meeting" ? 302 : 200);
    if (e.type !== "meeting") {
      assert.ok(html.includes(`<title>${e.title} | NOSEE</title>`));
      assert.ok(html.includes('name="robots" content="noindex, nofollow"'));
    }
    report.routes.push(e.slug);
  }
  await request("/events/icelli2026?q=ignored", 302);
  await request("/events/icelli2026/", 302);
  await request("/events/%69celli2026?q=ignored", 302);
  const targetHead = await requestHttp(base + "/events/icelli2026", "HEAD");
  assert.deepEqual(targetHead, { status: 302, location: "https://icelli.nosee.org", html: "" });
  report.requests++;
  if (reference) { assert.deepEqual(await requestHttp(reference + "/events/icelli2026", "HEAD"), targetHead); report.comparisons++; }
  for (const path of ["/events/missing-event", "/events/nosee-annual-general-meeting", "/nonexistent-public-url", "/news/missing"]) await request(path, 404);
  const invalid = await requestHttp(base + "/events/ICELLI2026");
  assert.equal(invalid.status, 404);
  assert.ok(invalid.html.includes(">Page not found</h1>"));
  report.requests++;
  if (reference) {
    const source = await requestHttp(reference + "/events/ICELLI2026");
    assert.equal(source.status, 500);
    report.deviations.push({ path: "/events/ICELLI2026", sourceStatus: 500, targetStatus: 404, reason: "Task requires unknown-slug 404; source rejects non-kebab-case filenames with a loader error." });
  }
  await request("/publications", 200);
  await request("/events/archive", 200);
  await request("/events/archive/", 200);
  await request("/events/environmental-data-training/", 200);
  await request("/events/missing-event/", 404);
  await request("/about/", 200);
  await request("/events/", 200);
  if (clock) for (const instant of ["2026-09-20T15:59:59.999Z", "2026-09-20T16:00:00Z", "2026-09-26T14:59:59.999Z", "2026-09-26T15:00:00Z", "2026-09-26T18:00:00Z", "2026-09-26T18:00:00.001Z", "2027-07-18T22:59:59.999Z", "2027-07-18T23:00:00Z", "2027-07-23T22:59:59.999Z", "2027-07-23T23:00:00Z"]) {
    writeFileSync(clock, instant);
    const slug = instant.startsWith("2026") ? "community-sky-observation-day" : "environmental-data-training";
    const expected = presentEvent(eventRecords.find(e => e.slug === slug), new Date(instant), true);
    const html = await request(`/events/${slug}`, 200);
    assert.ok(html.includes(`data-event-state="${expected.state}"`));
    if (expected.presentation.application_deadline) assert.ok(html.includes(expected.presentation.application_deadline));
    report.rollover.push({ instant, slug, state: expected.state, deadline: expected.presentation.application_deadline });
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (clock) writeFileSync(clock, initial);
}
