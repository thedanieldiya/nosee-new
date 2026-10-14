# Task 09 — Event details, meeting 302 and 404

**State:** In review, 2026-10-14. Branch `codex/task-09-event-details-404`; base latest main `3e62ce62e73c956c5f8dc5ad7e15919ca4196586`, including merged Task 08 (`5a15a55`). Read-only Laravel pin `9872c4ed12aa48835eab71065c69b468424adb4a`.

Read Task 09, AGENTS, concise tracker and relevant PRD/progress/migration requirements; applied Ponytail/frontend/review guidance and cloud onboarding setup verification. Original source routes/controller/detail service, presentation helpers, all nine records, Blade detail/404/layout/primitives and focused PHP tests inspected completely. Laravel ran from a temporary pinned archive with cached vendor/original compiled assets; its checkout stayed clean.

## Delivered

- Eight regular `/events/[slug]` pages: literal server-rendered header, conditional information/register, escaped body, itinerary/resources and people. Reuses existing exact records, palette and `presentEvent(record, now, true)`; past deadlines remain visible. Dynamic requests, source titles, fixture `noindex,nofollow`.
- `/events/icelli2026`: native route response, **302**, exact `Location: https://icelli.nosee.org`, no trailing slash/query forwarding/detail content. HEAD also returns 302. External site was neither fetched nor changed.
- Unknown slugs and unmatched public paths: **404**, “Page not found — NOSEE”, original heading/Container, expanded header, shared nav/footer and readable SSR content with JS off. Owner allowed a custom 404 matching the current design; the original simple design already matches and is retained.
- Archive routing stays 200 ahead of `[slug]`. The old AGM slug and unimplemented source destinations still return 404. No content, existing page/controller, asset, dependency or production-setting changes; itinerary types now admit source-valid null titles/end times.

## Verification executed

Frozen server instant **2026-10-14T12:00:00Z**, matching source/target clocks. Node 24.19.0, PHP 8.4.26, Next 16.4.0, Chromium **154.0.8037.57**; DPR 1, en-GB, Africa/Lagos, light, normal zoom, unthrottled, decoded fonts/images and settled nav.

| Gate | Measured result |
| --- | --- |
| Native tests | **97/97 pass**: seven added; existing 90 unchanged |
| Focused PHP comparison | Nine exact records, **99 complete presentations** (11 instants × nine), 11 missing lookups, synthetic nullable itinerary/online location/escaped body and actual Blade checks |
| Production HTTP | **34/34 matching source/target comparisons**, 35 target checks: all nine slugs, query/HEAD/encoded/trailing redirect, missing destinations, slash variants, archive and ten fresh state/deadline requests; invalid uppercase source 500 → required target 404 recorded separately |
| Five-width visuals | **25 full-page pairs**: three detail variants and two 404 paths at **390/768/1024/1280/1440**; full geometry, content, typography, styles, navigation active state and no overflow match |
| Independent crops | **15 pairs**: five-day itinerary, closed deadline/single-day time, future deadline/hybrid information at all five widths |
| Focus / reduced motion | **Four pairs**: keyboard resource focus at 390/1440, normal/reduced; register hover/style/attributes, Tab order, mobile Enter/Escape/focus return and desktop focus dropdown match |
| Existing-page regression | Homepage, About, listing, archive at 390/1440: **eight pairs**, plus **eight comparisons against committed pre-task target screenshots**, all exact |
| Interactions / JS off | Hero indicator/mobile swipe; About last group/desktop arrow wrap; monitoring hover/focus/reduced movement; research DOI visibility/attributes; footer. Detail and both 404 paths: six JS-off source/target checks, correct status/content/title and unchanged visible URL |
| Required checks | Typecheck, lint **zero warnings**, final production build and `git diff --check` pass; About remains static, event date states stay per-request |

**52 source/target RGB pairs + eight previous-target comparisons: zero changed pixels, no masks/tolerance.** Detailed DOM/style dumps, entire screenshot matrix, PHP exports and logs are temporary artifacts, not tracked. Five representative pairs and their SHA-256 values/counts are in [manifest.json](manifest.json). The focused browser runner reproduces the 44 new-route/state pairs without storing artifacts in Git.

Representative full-page pairs:

| State | Laravel | Next |
| --- | --- | --- |
| Five-day training, phone | [390px](reference-training-full-390.png) | [390px](target-training-full-390.png) |
| Five-day training, desktop | [1440px](reference-training-full-1440.png) | [1440px](target-training-full-1440.png) |
| Workshop/future deadline/resources, tablet | [768px](reference-workshop-future-full-768.png) | [768px](target-workshop-future-full-768.png) |
| Single-day/closed deadline/register | [390px](reference-single-past-full-390.png) | [390px](target-single-past-full-390.png) |
| Shared 404 | [1440px](reference-missing-public-full-1440.png) | [1440px](target-missing-public-full-1440.png) |

The temporal checks cover just before/at application closure; before/at timed start; inclusive timed end and +1ms; Lagos midnight multi-day start; inclusive final day and next midnight. Full PHP presentations preserve all three location types, null-time omission, resource/speaker/register presence and itinerary punctuation/order/null variants. Source presentation SHA-256: `f813bf4a90eeeb961789ebc49fa1c45503fdf3d3bba1006743761fa0089387a2`.

## Compatibility findings and retained limits

Initial production checks exposed Next redirect URL normalization, encoded/slash meeting routing and blank JS-off matched-slug fallback HTML. A native meeting route preserves the exact Location. Next's documented `experimental.globalNotFound` supplies full unmatched-route HTML; a narrowly matched GET/HEAD Proxy rewrites unknown event slugs to an unmatched path and encoded/slash meeting variants to the native handler, preserving the visible URL/query and event nav prefix. `skipTrailingSlashRedirect` disables Next’s automatic 308 so Laravel-compatible trailing-slash requests render directly, including meeting 302; canonical existing routes stay unchanged. Actual 404 status, SSR shell, title and hydrated/JS-off output are verified. This experimental routing API is a framework compatibility dependency; no visible parity discrepancy remains. Root/group boundaries still call/render the normal not-found content.

Resolved harness failures were rerun: Node fetch encountered the PHP server's redirect framing (native HTTP now used); static-render datetime case differed from browser-normalized attributes; existing listing wrapper differences required comparing actual page geometry/content; reduced motion retains source button color transitions; Tailwind hover lift uses `translate`, not `transform`. These were verification corrections; no source UI was corrected or waived.

Preserved limitations: mobile no-JS menu/toggle remains hidden as in Laravel (**not** an accessibility pass); About gutter/fragment quirks, approved hero entrance and newsletter honest-error exception remain. Missing AGM, news/publications/data/login and other unimplemented source destinations stay 404. Development records, indexing approval, critical external-link validation and owner parity acceptance remain open. Explicit status deviation: `/events/ICELLI2026` triggers the source filename validator’s **500**, while the exact typed lookup returns the requested **404**. No case normalization/substitute event. No new animations; external registration/resource/DOI sites were not followed.

Cold mobile training: target compressed HTML **18,088 B** (decoded **145,183**), JS **137,179**, CSS **11,441**, fonts **80,884**, shell images **20,721**; 19 document/resource requests, no external requests. Laravel uses uncompressed HTML **67,785**, JS **9,116**, CSS **83,447**. These local encodings differ and are not network/CWV benchmarks. New detail is server-only with no event controller/image banner. Homepage JS/images remain **138,723 / 3,938,451 B**; shared compressed CSS is **+248 B** over Task 08. Low-bandwidth/CWV acceptance is still open.

## Reproduce

Use the pinned isolated Laravel archive with writable runtime folders/vendor/original build and a production Next server; activate the environment's PHP configuration first. For temporal requests, reuse Task 08's test-only `reference-clock-router.php` and `target-clock.mjs` with their clock-file paths replaced by the same temporary file. Neither shim enters the application. Browser QA needs environment-provided Playwright/Chromium and Python Pillow/NumPy; no application dependency added.

```bash
node --test tests/*.test.mjs
node tests/compare-event-details.mjs /tmp/nosee-task09/reference
npm run typecheck
npm run lint
npm run build
node tests/check-event-routes.mjs http://127.0.0.1:3014 http://127.0.0.1:8003 --clock=/tmp/nosee-task09/clock.txt
node tests/check-event-pages.cjs http://127.0.0.1:8003 http://127.0.0.1:3014 /tmp/nosee-task09/captures
```

Existing-page visual/carousel checks reused the Task 08 regression harness/helpers in `/tmp`, changing only ports/output/clock paths, then compared RGB against both Laravel and the eight committed Task 08 target baselines. Additional temporary checks exercised source/target monitoring/research reduced motion and listing/archive geometry/content. Historical evidence remains untouched.

Branch publication/verified preview availability is recorded in [PROGRESS.md](../../PROGRESS.md). No PR, merge, production change, Task 10 or evidence cleanup. Stop for owner review; final source-port acceptance and later separately approved cleanup remain required.
