# Task 08 — Events listing, GET search and archive

**14 October 2026 · Task 08 In review · P3/PUB-03 In progress.** Branch `codex/task-08-events-listing-archive` starts at latest main **`13d08a47cbdad14952f78f4ae24bdce8c70bb6fb`**, including the owner's merged [Task 07 PR #7](https://github.com/thedanieldiya/nosee-new/pull/7), merge `c6c45b00e4182e2279a82ca1e568f66973ac133c`. No PR, merge, production settings, details/redirect route or Task 09 implementation.

**Publication warning:** all nine original events are development fixtures, not verified public NOSEE events. Exact titles, descriptions, dates, locations and URLs are retained without a visible invented badge. Both new pages have task-required **noindex,nofollow**, unlike the source. Content/indexing acceptance remains with the owner.

## Authority, inspection and source mapping

Read the task, AGENTS/PRD/PROGRESS/migration map/visual baseline, prior homepage/About evidence, Ponytail/frontend/review guidance and installed Next page/searchParams documentation. Inspected the complete 370-line listing service, controller/routes, repository/loader, all nine files, event-type configuration, UTC app configuration, both Blade pages/four components, shared primitives/layout/CSS/SVGs and the three focused PHP test files. Existing homepage selectors, typed records, shell, controllers, CSS source, dependencies and original media remain unchanged.

| Pinned Laravel source | Destination |
| --- | --- |
| `events/index.blade.php` + `EventController::index` | `src/app/(public)/events/page.tsx` — native server GET search and complete listing |
| `events/archive.blade.php` + `EventController::archive` | `src/app/(public)/events/archive/page.tsx` — server-rendered archive |
| `EventListingService.php`, `config/event-types.php` | `src/lib/content/events-listing.ts` — injectable current instant, presentation, classification, sorting/grouping/search |
| `featured-event.blade.php` | `src/components/site/events/FeaturedEvent.tsx` |
| `listing-event-card.blade.php` | `src/components/site/events/ListingEventCard.tsx` |
| `day-group.blade.php` | `src/components/site/events/EventDayGroup.tsx` |
| `month-heading.blade.php` | `src/components/site/events/EventMonthHeading.tsx` |

All four components are server components. Native `<a>`/`form`/`time` semantics, source button icon wrappers, type palettes, date panels, application row and sticky headings are retained. No Events client island, filter API, pagination, external content fetch, runtime dependency or image substitution. Both routes use `force-dynamic` and the existing ordinary-page expanded-header wrapper; homepage/About layouts are untouched.

## Pinned local renderer and synchronized time

Reference **`9872c4ed12aa48835eab71065c69b468424adb4a`** was archived into `/tmp/nosee-task08-reference.Dj2Nqb`; `/workspace/nosee` stayed clean/read-only. Existing vendor was linked; the archive already contains the pinned build/media. No legacy install, rebuild, dependency/config edit or PHP test-suite execution. Isolated `.env`, local generated key, writable storage/cache, `APP_NAME=NOSEE`, English locale, UTC app timezone and array session/cache are local reference settings, not verified live production configuration.

Source: `http://127.0.0.1:8003`; **finished production Next**: `http://127.0.0.1:3014`. Default synchronized instant **2026-10-14T12:00:00Z**. PHP's actual `Carbon`/`CarbonImmutable` clock and Next's constructor clock read the same file, including state captures. Chromium timezone alone was never used to freeze server decisions. The homepage's native PHP repository clock is separate; at the actual October capture date its UTC fixture selection equals the target and the previous homepage baseline.

Reproduce using Node 24.19.0, PHP 8.4.26, preinstalled Playwright, Chromium **154.0.8037.57**, Pillow/numpy; no package installation needed in this environment:

1. Activate `/workspace/cloud-setup/activate.sh`. Archive the pinned SHA into a fresh temporary directory; link `/workspace/nosee/vendor`. Keep the archive's existing tracked `public/build` (CSS `app-D8pWRZYp.css`, 83,447 bytes). If build is absent in another environment, provision the matching pinned assets independently.
2. Create isolated Laravel storage/framework/views/sessions/cache/data, storage/logs and bootstrap/cache directories and local `.env` with a fresh key and the settings above. Never copy credentials into evidence.
3. Copy [clock-router.php](clock-router.php) into the archive root. Write `2026-10-14T12:00:00Z` to `/tmp/nosee-task08-clock.txt`. From **archive/public**, run `php -S 127.0.0.1:8003 -t . ../clock-router.php`. Verify actual expected HTML **and nonempty CSS**, not status alone.
4. Build Next, then start with `NODE_OPTIONS="--import=$PWD/docs/evidence/task-08/server-clock.mjs" npm run start -- --hostname 127.0.0.1 --port 3014`. The [clock preload](server-clock.mjs) preserves native elapsed `Date.now`/own static APIs and is test-only; ordinary deployment uses the real clock without a custom server or preload.
5. Export the executable oracle: `php docs/evidence/task-08/export-source.php "$REFERENCE_ARCHIVE" < docs/evidence/task-08/oracle-input.json > docs/evidence/task-08/source-oracle.json`.
6. Run the committed `browser-checks.cjs`, `state-checks.cjs`, `rollover-checks.cjs`, `regression-checks.cjs`, `additional-checks.cjs` **sequentially** from this directory or by their full paths. They share a clock; do not run clock-changing harnesses concurrently. Run `python3 docs/evidence/task-08/compare-pixels.py` after captures.

## Temporal, presentation and native search evidence

[PHP export harness](export-source.php), [29 complete inputs](oracle-input.json), [complete PHP outputs](source-oracle.json) and [focused tests](tests.txt) compare **every record/presentation field and the entire build/archive hierarchy**, rather than only counts. All nine existing TypeScript records remain byte-value equal to the repository export.

- Baseline: **6 upcoming, 0 ongoing, 3 archived**. Fallback featured **ICELLI**, `featured=false`, `image=null`, remains duplicated under November. `?q=%20LaGoS%20` refills `LaGoS` and yields the Earth Observation workshop; featured is unchanged. No match empties upcoming only; an independently captured November ongoing ICELLI also survives the same no-match query.
- Calendar-date meeting/multi-day boundaries are inclusive in each event timezone. Timed single-day exact start/end are ongoing; one millisecond after end is past. Null end time runs through local end-of-day. Tokyo/New York offsets and New York/Berlin folds, New York spring gaps and Lord Howe's half-hour transition match actual PHP outputs. Server/browser timezone is not used as the event timezone.
- PHP ASCII trim and case-insensitive substring search are preserved across exactly the source fields, excluding slug/body/speakers/dates/URLs. Blank is null; bracketed `q[]=x` is ignored. Repeated scalar `q=impossible&q=Lagos` uses PHP's last scalar. Native JS-off GET submits the original typed query and SSR trims/refills safely; an escaped script-shaped query does not inject a script. Query `"0"` retains PHP's false-like empty-message condition.
- Featured meeting priority/fallback/duplication, ascending date/time/slug, descending archive ties, cross-month/year grouping by **start date only**, online/physical/hybrid locations (including source nonempty `"0"`), time labels, itinerary, date-range punctuation and deadline offset/equality all match the oracle. Past archive presentation omits deadlines even if the deadline itself is still in the future. No fabricated registration action.
- [Production rollover](rollover-checks.json) makes fresh GETs to **both routes** at six instants, with the same production build ID and no rebuild/restart. ICELLI is upcoming at `2026-11-17T22:59:59.999Z`, ongoing at `23:00Z` and through `2026-11-20T22:59:59.999Z`, then archived at `23:00Z`. All-future archive is empty; all-past archive has nine cards and listing has none. Source/target SSR counts/destinations agree; Next response cache policy is private/no-store.

## Independent screenshots and complete-page comparisons

**[118 actual PNGs / 59 source-target pairs](pixel-comparisons.json)** plus **four comparisons to merged Task 07 full-page targets**: **63/63 equal dimensions and zero differing RGB pixels**, with no tolerance, registration, masking or image modification. Owner visual acceptance is still required; this is local pinned-renderer evidence, not a claim about untested live/configuration/browser states.

Conditions: DPR 1, en-GB, Africa/Lagos browser zone, light theme, normal motion unless explicitly reduced, normal zoom, unthrottled, identical server instant, fonts/images decoded, settled expanded/compact header and scroll. All five widths independently cover each route:

| Viewport | Listing total page height | Archive total page height |
| --- | ---: | ---: |
| 390×844 | 6,151 | 3,399 |
| 768×1024 | 5,760 | 3,228 |
| 1024×768 | 4,367 | 2,214 |
| 1280×900 | 3,731 | 1,950 |
| 1440×1000 | 3,591 | 1,930 |

[Baseline manifest](browser-checks.json) includes **39 pairs**: both viewport pages at all widths; featured/month/day/row and archive year/day/card crops; full listing/archive at 390/1440. Descendant geometry, normalized leaf copy, semantic attributes, typography, borders, grid dimensions, spacing and CSS styles match. CSS palette serialization differs (`oklch` in source, optimized `lab` in Next); the comparison resolves colors through the same 8-bit browser canvas, and independent screenshot RGB is exactly equal. No palette adjustment was made.

[State manifest](state-checks.json) adds **12 pairs**: desktop results/no-results, unfiltered ongoing, future/closed deadline, mobile archive-empty/all-past listing-empty, listing/archive keyboard focus, search button focus, compact sticky heading and reduced-motion card. [Additional checks](additional-checks.json) add **four pairs**: all-past archived external meeting, desktop archive-empty, mobile sticky viewport and reduced-motion archive card.

Representative complete pages:

| Page | Laravel | Next |
| --- | --- | --- |
| Listing mobile | [390px](reference-full-events-390.png) | [390px](target-full-events-390.png) |
| Listing desktop | [1440px](reference-full-events-1440.png) | [1440px](target-full-events-1440.png) |
| Archive mobile | [390px](reference-full-archive-390.png) | [390px](target-full-archive-390.png) |
| Archive desktop | [1440px](reference-full-archive-1440.png) | [1440px](target-full-archive-1440.png) |

## Controls, breakpoints, motion and regressions

- Search is hidden below **1024**, present at 1024; native keyboard Tab/Enter submits GET and focus styling matches. Breakpoint checks at **390/639/640/768/1023/1024** cover both pages, nav drawer/Escape/focus return, desktop dropdown and zero document horizontal overflow.
- Sticky months pin at **72px mobile / 104px desktop** after nav compacts; the previous month releases when the next group enters. Original card columns/date column/min heights and source row CTA behavior survive. No new reveal/slide animation.
- On desktop both routes lift cards **4px** on hover/focus, use **250ms** CSS transition and a **2px** link focus outline. Reduced motion on **both** routes removes movement/transition while retaining the source shadow behavior. Relevant paired focus/reduced screenshots also have zero RGB differences.
- Meeting links keep external URL, `_blank`, `noopener noreferrer`, original external icon/CTA. Native clicks on source and target create a new tab requesting `https://icelli.nosee.org/`; the harness aborts that external request and claims no microsite or registration success. Regular links stay in the same tab. A target native workshop click currently returns **404**, explicitly deferred to Task 09.
- JS-off desktop listing GET and populated archive SSR work. Both no-JS mobile menus remain hidden/nonfunctional, as in source; this is **not** a navigation/accessibility pass.
- [Homepage/About regressions](regression-checks.json): four full-page pairs at **390/1440**, each zero RGB against source **and** the prior merged Task 07 target. All five homepage sections, About editorial regions, cumulative geometry, footer and header are unchanged. Hero indicator/mobile swipe and About last-group/desktop arrow wrap pass. Existing 50 tests also pass. Homepage image and JS bodies do not grow; no Events dependency enters its client runtime.
- Final baseline browser console/page errors and bad asset responses are empty. No screen-reader/cross-browser/WCAG audit, Lighthouse, throttled performance or field Core Web Vitals claim; no broad PHP suite or deployment acceptance is inferred.

## Original SVGs and measured local payload

[Asset manifest](assets.json): all six originals have identical disk and decoded HTTP SHA-256, HTTP **200** in both renderers. Five files were newly copied; existing arrow unchanged.

| Original file | Bytes | SHA-256 |
| --- | ---: | --- |
| `search.svg` | 424 | `d881908392d05bc5e6f5621eb938bf519fbc42f12ba19c1ac06a17fbfbfc3d83` |
| `arrow-up-right.svg` | 319 | `2118ef5cf2cbc8da84600ccf1232bd9f3ac0d6b5ccf61fc3fd2e1798da2d90bc` |
| `CalendarDots.svg` | 1,619 | `f378a749949ee3baca15844b219fd031ddfb031b32cb64f0277c424a6684a0ac` |
| `Clock.svg` | 570 | `47a446f73bf837172a992614c01aab6a2fabef4477ac6a452cef94ebcf3ece4e` |
| `MapPin.svg` | 1,266 | `e93b9a0428051386d04d00453d3d68bed6eda370e0d627bad04e09e3c6542c79` |
| `arrow-right.svg` | 217 | `b43d668b77b7302167f0ff2baeb72a06a44b06e0acd40aab65840192255397f5` |

[Performance observations](performance-observations.json), cold new Chromium contexts, encoded response bodies:

| Next route/width | JS | CSS | Fonts | Logo/icons | Requests | HTML encoded / decoded |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Listing 390 | 137,179 | 11,193 | 80,884 | 23,347 | 25 | 18,558 / 149,186 |
| Listing 1440 | 137,179 | 11,193 | 97,860 | 23,347 | 26 | 18,558 / 149,186 |
| Archive 390 | 137,179 | 11,193 | 80,884 | 22,068 | 22 | 15,621 / 112,293 |
| Archive 1440 | 137,179 | 11,193 | 97,860 | 22,068 | 23 | 15,621 / 112,293 |

There is **no event raster image**: the featured block is source gray. Next gzip reduces CalendarDots/MapPin encoded bytes while decoded originals remain identical. Local PHP sends uncompressed 83,447-byte CSS, 9,116-byte JS and 25,136/22,774 logo/icon bodies; its server compression/caching is not a production comparison. Next's framework runtime still outweighs Laravel's custom JS. About/hero controller code is absent from **target Events** chunks; source uses one shared JS bundle containing those controllers.

Homepage remains **138,723 JS / 3,938,451 images** and **105,240 mobile / 122,216 desktop fonts**. Global compiled CSS grows **856 encoded bytes**, 10,337→11,193, to cover event classes; CSS source and existing page pixels stay unchanged. The ~3.94MB homepage initial originals remain an unresolved bandwidth issue. Resource body totals/local transfer entries are measurements, not field budgets/CWV success; PERF-01 stays open.

## Source quirks, deviations and verification corrections

**Observed source takes precedence over assumed task-document behavior:**

1. The archive button is **visible even at 390/639**, despite Blade's `hidden sm:inline-flex`. Its shared base `inline-flex` wins the conflicting utility. Row CTA likewise remains visible on mobile despite `hidden ... lg:inline-flex`. Source and target use the same literal classes and visible result. No unauthorized hide-rule correction.
2. ICELLI's long CTA sets a **688.421875px implicit featured grid column inside a 358px mobile card**; article overflow clips title/summary/action/location. Document width stays 390. This original clipping is captured, not silently fixed with a new `min-w-0` or alternate wording.
3. Featured selection/search duplication, no mobile search, gray image, odd archive/CTA heading levels and undated deadline `<time>` markup remain literal. Other event slugs/details/meeting redirects await Task 09. The unknown source hero AGM destination still has no fixture.
4. Existing newsletter error-only safety behavior, task-approved hero six-stage entrance, noindex protections, NSEE/NOSEE text, About initial carousel gutter/native 1px fragment variance/no-JS heading coverage, and incomplete news/publications/collaboration/other routes remain documented from prior tasks. Unapproved fixture/editorial content is not launch-ready.

Resolved verification failures were rerun: initial test import order bypassed the existing resolver (changed to dynamic import); the test PHP router swallowed `false`, returning empty static 200 responses (propagated router return; verified actual CSS bytes); the initial archive/search expected visibility followed the brief rather than the actual shared-button output (corrected assertions, retained source UI); computed color string encodings differed despite equal RGB (explicit canvas color normalization + exact pixels); a focus capture selected the heading ID rather than its labelled section (fixed selector); raw HTTP card counting included Next RSC copies (scoped to actual main HTML); regression selected a hidden final carousel indicator (selected the last visible indicator). These were harness/test corrections, not waived UI differences. Parser tests exposed PHP form-feed/repeated-scalar details; implemented and tested before the **second/final production build**. Unused harness variables were removed; final lint has zero warnings.

**[90 tests](tests.txt): 40 new + 50 existing, zero failures/skips.** [Typecheck](typecheck.txt), [warning-free lint](lint.txt), [final production build](build.txt), HTTP/temporal/visual/interaction/regression checks and diff whitespace pass. `/events` and `/events/archive` are dynamic; `/about` stays static. No dependency/lockfile/shared page changes.

Publication evidence will be recorded after the authorized push. A Vercel preview is reported only if verified; the main domain is not a branch preview. **Stop for owner visual review. Task 09 has not begun.**
