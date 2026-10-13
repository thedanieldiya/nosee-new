# Task 06 complete-homepage evidence — 13 October 2026

All five original sections now render in Laravel order. Task 05 [PR #5](https://github.com/thedanieldiya/nosee-new/pull/5) is merged. Task 06, P2 and PUB-01 are **In review**, not Done; owner full-homepage acceptance and the documented content/accessibility/performance decisions remain open.

## Reference, target and capture conditions

Branch `codex/task-06-complete-homepage` starts from latest main **`2adf6da50577e76b03c8e9d45bb06ead8220e76e`**, including Task 05 merge `6bb23ee37382b3431b0082414c56134741a72151`. Reference: read-only Laravel **`9872c4ed12aa48835eab71065c69b468424adb4a`**.

Implementation/capture commit: **`245b6e0e361b2263798ad004b7b7041be9d2e9bb`**; subsequent task commits update documentation/publication only.

Recreated the [isolated Git-archive renderer](../task-05/README.md#reference-and-reproduction) in `/tmp`, using existing vendor/build assets, isolated environment/cache/views/storage, `APP_NAME=NOSEE`, array sessions/cache and source **UTC** timezone. No legacy writes/install/build/test suite. The configured local renderer is the reference; live deployment configuration remains unverified.

Final Next production build and existing Chromium **154.0.8037.57** / Playwright; DPR **1**, locale **en-GB**, timezone **Africa/Lagos**, light scheme, normal motion unless labeled reduced, no CPU/network throttling. Source export and captures are as of **2026-10-13 UTC**. Awaited fonts, all original images, entrance and navigation transitions. A pointer-selected first indicator holds slide 1 during long captures. Section crops use native Chromium document-coordinate capture beyond the viewport; no source DOM/style edits. Full pages at 390/1440px retain expanded navigation. Fractional section coordinates are preserved in measurements; PNG crops rasterize to integer pixels.

## Six source mappings and exact content

Paths below are relative to source `resources/views/components/` and target `src/components/site/`.

| Laravel | Next server component |
| --- | --- |
| `home/research-outputs.blade.php` | `sections/HomeResearchOutputs.tsx` |
| `cards/research-output-card.blade.php` | `cards/ResearchOutputCard.tsx` |
| `home/trending-news.blade.php` | `sections/HomeTrendingNews.tsx` |
| `cards/trending-news-card.blade.php` | `cards/TrendingNewsCard.tsx` |
| `home/upcoming-events.blade.php` | `sections/HomeUpcomingEvents.tsx` |
| `cards/event-card.blade.php` | `cards/EventCard.tsx` |

[Fresh pinned PHP export](source-data.json) independently matches **all 10 publications, 9 news and 9 events**, including unused fields. Typed literal exports live in `src/lib/content/{publications,news,events}.ts`; explicit selectors/presentation helpers are in `homepage-selections.ts`. No CMS/parser/database or new library.

- Research: strict true featured flag; publication date descending / slug ascending; three selected: `low-latitude-geomagnetic-storm-responses`, `urban-aerosol-optical-depth-patterns`, `satellite-soil-moisture-drought-signals`. Exact area uppercase, authors/comma spacing, year/source, fixture DOI and desktop-only stroke/arrow action retained.
- News: strict featured rank first, then **raw ISO strings** descending and slug ascending; four selected: `solar-storm-monitoring-exercise`, `space-station-instrument-calibration`, `air-quality-smoke-transport-study`, `regional-earth-observation-partnership`. Original curly apostrophe, sr-only category/excerpt, offset calendar date, one featured + three compact cards and fourth story's reused image retained. News changes at **md 768px**, pairs outer columns only at **xl 1280px**; research/events columns change at **lg 1024px**.
- Events: strict featured and `(end_date ?? start_date) >= UTC today`, start/slug ascending. Baseline: `regional-space-weather-conference`, `earth-observation-data-workshop`, `atmospheric-measurement-seminar`. Exact summary/date range/physical/hybrid/online presentation and same-tab meeting/detail URLs retained. Date-sensitive selection runs per server request (`force-dynamic`), not at build time or in the browser.

These are **development fixtures**, not verified publications/news/events. No content was corrected or labeled differently in the visible UI. `noindex, nofollow` remains pending explicit owner publication approval.

## Original media and temporal checks

| Added original PNG | Natural pixels | Bytes |
| --- | --- | --- |
| `trending1.png` | 642×642 | 285,633 |
| `trending2.png` | 310×309 | 174,097 |
| `trending3.png` | 310×309 | 87,943 |

Total **547,673 bytes**. [Full SHA-256 hashes](assets.json) match original and target bytes; existing 217-byte arrow is also verified. Preserved original 642×642 HTML image attributes on all cards, cover crops, gradient and eager semantics. No fourth image, conversion, lazy attribute or `srcset`.

Native tests check strict flags, limits/nonmutation, sorting/ties, ISO string versus instant ordering, offset date labels, all event presentation transforms and UTC midnight. The actual current PHP repository is the baseline oracle; future-day oracle explicitly injects `today` into the pinned predicate/comparator. [Final production HTTP rollover](server-rollover.json) changes one process's test-only Date constructor outside the repository: **3 → 2 → 1 → 0 cards**, across 12/13 March, 23 April and 15 May 2027 UTC, without rebuild/restart between requests. Native elapsed time/Date APIs remain intact. Response cache controls are private/no-cache/no-store, so HTML cannot permanently freeze build-day selection.

## Independent screenshot pairs and full-page comparison

| Width | Research (source / target) | News (source / target) | Events (source / target) |
| --- | --- | --- | --- |
| 390 | [S](reference-research-outputs-390.png) / [T](target-research-outputs-390.png) | [S](reference-trending-news-390.png) / [T](target-trending-news-390.png) | [S](reference-upcoming-events-390.png) / [T](target-upcoming-events-390.png) |
| 768 | [S](reference-research-outputs-768.png) / [T](target-research-outputs-768.png) | [S](reference-trending-news-768.png) / [T](target-trending-news-768.png) | [S](reference-upcoming-events-768.png) / [T](target-upcoming-events-768.png) |
| 1024 | [S](reference-research-outputs-1024.png) / [T](target-research-outputs-1024.png) | [S](reference-trending-news-1024.png) / [T](target-trending-news-1024.png) | [S](reference-upcoming-events-1024.png) / [T](target-upcoming-events-1024.png) |
| 1280 | [S](reference-research-outputs-1280.png) / [T](target-research-outputs-1280.png) | [S](reference-trending-news-1280.png) / [T](target-trending-news-1280.png) | [S](reference-upcoming-events-1280.png) / [T](target-upcoming-events-1280.png) |
| 1440 | [S](reference-research-outputs-1440.png) / [T](target-research-outputs-1440.png) | [S](reference-trending-news-1440.png) / [T](target-trending-news-1440.png) | [S](reference-upcoming-events-1440.png) / [T](target-upcoming-events-1440.png) |

| Full / interactive state | Source | Target |
| --- | --- | --- |
| Full homepage, 390 | [Source](reference-full-homepage-390.png) | [Target](target-full-homepage-390.png) |
| Full homepage, 1440 | [Source](reference-full-homepage-1440.png) | [Target](target-full-homepage-1440.png) |
| News hover | [Source](reference-trending-news-hover-1440.png) | [Target](target-trending-news-hover-1440.png) |
| News tile keyboard focus | [Source](reference-trending-news-tile-focus-1440.png) | [Target](target-trending-news-tile-focus-1440.png) |
| Events keyboard focus | [Source](reference-upcoming-events-focus-1440.png) | [Target](target-upcoming-events-focus-1440.png) |
| News reduced-motion hover | [Source](reference-trending-news-reduced-hover-1440.png) | [Target](target-trending-news-reduced-hover-1440.png) |
| Events reduced-motion focus | [Source](reference-upcoming-events-reduced-focus-1440.png) | [Target](target-upcoming-events-reduced-focus-1440.png) |

**All 22 final RGB pairs have zero differing pixels**: 15 independent section pairs, two full pages and five interactive pairs. [Pixel results](pixel-observations.json). [Browser measurements](browser-checks.json) compare every section descendant's geometry, text, relevant attributes and computed styles (origins normalized only for mask URLs), storing matched hashes and section/card/heading rectangles. All six section/footer positions and total document heights match at all five widths: **7388 / 7859 / 5548 / 4058 / 4136px**. No cumulative spacing error. No viewport omission; this does not certify untested pages or replace owner acceptance.

## Behavior, corrections and required checks

[Interaction/regression evidence](interaction-checks.json): desktop-only DOI controls and focus, news feature/mobile date chips and CTAs, 300ms image hover scale 1.1, no focus-only zoom, reduced-motion cancellation, green/white VIEW MORE focus, event 4px hover/focus lift / 250ms transition and reduced-motion no lift. Source reduced motion retains duration values/shadow while disabling transition property. Accessible same-tab/external attributes and focus outlines match.

Hero manual selection/swipes at 390/768, desktop 5999/6000ms autoplay/hover pause/wrap, drawer focus entry/Tab wrap/exclusive submenus/Escape/focus return/overflow restoration, monitoring hover and footer dimensions passed. Target valid synthetic newsletter input shows the existing error, sends **no request**, and leaves success dialog closed. Both renderers provide all five readable sections with JS disabled; the existing no-JS mobile drawer remains hidden/broken, explicitly **not a navigation pass**. Target resources are same-origin HTTP 200, without browser errors or horizontal overflow.

[Reveal observations](reveal-reference.json) independently sample each new section at 390/1440px, normal/reduced motion: **zero actual animation calls**, final opacity/transforms retained. Target keeps hooks without activating reveals. The existing **owner-approved seven-element/six-stage hero entrance** remains unchanged and differs from the source's inactive entrance.

[Typecheck](typecheck.txt), [lint](lint.txt), **[33 focused tests / 0 failures](tests.txt)** and [final production build](build.txt) pass. The four SSR tests were [rechecked](tests-research-recheck.txt) after the rendering fix; changed files received targeted lint and final typecheck. `/` is dynamic SSR; `/_not-found` static. `GET /` and original media return 200. No dependency/lockfile changes; existing browser/compiler tooling reused. Whitespace/relative links checked.

Resolved findings, not waived: initial SSR assertions counted the card-group hook and assumed lowercase attribute serialization; corrected semantic checks passed. Pixel comparison found **232–703 differing research pixels** in the italic year/source labels; composing one text string removed the text-run kerning differences. Full-page captures initially caught unfinished navbar opacity; waiting for actual navigation animations fixed the capture state without editing navigation. A second build was necessary after the research rendering fix. The test-only server clock initially lacked own static Date APIs required by Next wrapping; corrected harness passes. Autoplay checks now clear native timers and pause virtual time before precise 5999/6000ms checks; this corrected harness timing, not carousel code. No rendered discrepancy remains in the captured regions.

## Performance, limitations and review

Final cold contexts before interaction: encoded subresources **JS 138,486; CSS 9,092; fonts 105,240 mobile / 122,216 desktop; images 3,938,451 bytes**. Versus Task 05: JS unchanged, CSS **+874**, fonts **+24,356**, images **+547,673**. Cold mobile reports **30 requests** including HTML; HTML **23,075 encoded / 170,278 decoded / 23,375 browser transfer bytes**. News adds three unique eager PNG requests despite four cards. Both hero originals, monitoring and news images load initially. React's automatic same-origin eager-image preloads differ from Blade discovery order; original files/img attributes remain unchanged. Browser transfer accounting is not full wire accounting; local unthrottled results are not CWV or budget success. **PERF-01 remains open**; optimization requires a separate approved task.

Known limits remain: unapproved fixture facts/DOIs, source no-JS menu/close-icon quirks, approved newsletter error-only exception, hero animation deviation, indexing decision and missing `/publications`, `/news`/details, `/events`/details and other public routes. Original URLs are not renamed or replaced; external fixture availability is not claimed. Shared hero/navigation/monitoring/footer/controllers/primitives/tokens are unchanged. No About/admin/backend/membership or broad Laravel/E2E suite, new browser install, screen-reader/WCAG certification, Lighthouse, throttled audit or field data.

[PROGRESS.md](../../PROGRESS.md) records commit/publication and any verified preview. No PR or merge. Stop for review. Next bounded milestone after acceptance: **Task 07 — the entire original About page**.
