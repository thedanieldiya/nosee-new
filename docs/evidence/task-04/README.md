# Task 04 hero/carousel evidence — 13 October 2026

The original two-slide hero now replaces the foundation specimen. The shared navigation and footer are unchanged. This increment is ready for visual review; the complete homepage is unfinished.

## Reference and capture conditions

Laravel revision: `9872c4ed12aa48835eab71065c69b468424adb4a`. Reused the [Task 03 isolated Git-archive renderer](../task-03/README.md#reference-and-capture-conditions), existing dependencies and production assets. Environment, views/cache and storage remain outside the read-only checkout; no source DOM, content or styles were changed. `APP_NAME=NOSEE` matches the Blade fallback; the live Laravel configuration remains unverified.

Target: local Next production server after the final build. Chromium **154.0.8037.57**, DPR **1**, locale **en-GB**, timezone **Africa/Lagos**, light scheme, normal motion unless labeled reduced. No CPU/network throttling. Awaited fonts, original images, entrance completion and settled slide transitions. Compared both slides at **390×844, 768×1024, 1024×768, 1280×900 and 1440×1000**. Captures crop the hero, including its overlaid header; the compact capture covers the visible hero after 25px scroll. They are not full-page comparisons or live-production captures.

## Source mapping and original assets

| Pinned source | Destination |
| --- | --- |
| `content/homepage.php` → `hero.items` | Literal typed `src/lib/content/homepage.ts`; independently deep-compared with PHP JSON export |
| `resources/views/components/home/hero.blade.php` | Server `src/components/site/sections/HomeHero.tsx`; original classes, data hooks, stationary overlay and image/content tracks |
| `resources/js/hero-carousel.js` | Typed `hero-carousel.ts`, with timer/listener cleanup on unmount |
| `resources/js/homepage-animations.js` hero stages | `hero-entrance.ts`, native Web Animations; approved behavior change described below |
| Homepage composition | Public `page.tsx`: hero only, then existing layout footer; source title `NOSEE`, interim page-specific `noindex, nofollow` |

Both source records retain ordering, IDs, every title/summary/alt/credit, `Read` and CTA paths. This includes `Colloquim`, `Annual general meeting`, `Credit:Photo` and `/events/nosee-annual-general-meeting`. That unmatched source URL is not corrected. Neither event route has been migrated, so both destination CTAs currently reach 404 pages.

| Original asset | Dimensions | Bytes |
| --- | --- | --- |
| `hero-1.png` | 1440×850 | 1,269,779 |
| `hero-2.jpg` | 3892×2457 | 1,496,169 |

Total **2,765,948 bytes** (2.77MB / 2.64MiB). Originals were byte-compared and SHA-256 verified against the pinned checkout; [hashes and dimensions](assets.json). No conversion, resampling or optimization. Preserved the source HTML's 1440×850 attributes on both images, the centered **968px** mobile frame, desktop cover crop, **750/850px** hero heights, first-image high priority and second-image lazy loading.

## Approved entrance correction

The pinned source marks the entrance played but makes **zero** Web Animation calls with normal motion. Its `motion/mini` sequence call does not play the declared stages. After this was disclosed, the owner explicitly instructed: **“Enable specified six-stage animation.”** The target therefore implements the declared sequence, rather than matching the reference's inactive entrance. No Motion or other dependency was added.

| Stage | Delay / duration (ms) | Start → finish |
| --- | --- | --- |
| Visual | 0 / 650 | opacity 0→1; scale 1.02→1 |
| Eyebrow | 180 / 400 | opacity 0→1; Y 12→0px |
| Title | 320 / 600 | opacity 0→1; Y 20→0px |
| Summary | 480 / 500 | opacity 0→1; Y 16→0px |
| CTA | 640 / 450 | opacity 0→1; Y 12→0px |
| Credit and indicators | 820 / 400 | opacity 0→1 |

All use `cubic-bezier(0.22, 1, 0.36, 1)` and a shared document-timeline start after hydration. Six stages yield **seven** actual calls because credit and indicators are separate elements. Tests verify timings, easing, shared start, one-time initialization, disposal and restoration of original inline styles at completion. Reduced motion makes zero entrance calls. The first slide remains visible in SSR/no-JS HTML; page-request-to-entrance timing parity is not claimed.

## Checks actually executed

- `npm run typecheck`: passed. `npm run lint`: passed without warnings. `node --test tests/hero-carousel.test.mjs tests/hero-entrance.test.mjs`: **13 passed, 0 failed**. Initial production build passed; after restoring original animation end styles, the two entrance tests and final production build passed again. Builds prerendered `/` and `/_not-found`. `git diff --check` passed.
- [Browser observations](browser-checks.json): both slides matched source hero/text/CTA/arrow/credit/indicator geometry, wrapping, typography, overlay, image frames and inert/active state at all five widths. Actual summary paragraphs were separately remeasured with `h1 + p`. Shared header heights and footer dimensions matched; footer vertical position differs because four sections are absent. Target requests returned HTTP 200 with no browser errors or horizontal overflow.
- [Timer checks](timer-checks.json): source and target do not advance at 5999ms, advance at **6000ms**, wrap, and pause/restart with hover, focus, visibility, reduced-motion and desktop/mobile changes. Used Playwright's controlled clock and a simulated `document.hidden` value; this is not an OS background-tab test. Native focused tests also cover the **400ms** transition lock, **50px** horizontal swipe threshold, vertical/short/canceled/nonprimary pointers, manual reset, single-slide no-timer behavior and cleanup/reinitialization.
- Browser checks include indicator selection, mobile swipe outcome, reduced-motion rapid selection, visible **2px accent CTA keyboard focus**, desktop hover pause and compact header at **25px** scroll. Source and target first slide remain visible and second slide inert/hidden with JavaScript disabled. The separately documented source no-JS navigation defect and hidden close-icon quirk remain unchanged; this is not an overall no-JS navigation pass.

No dependency or lockfile changes; existing browser tooling reused. No broad Laravel/PHP/E2E suite, screen-reader/WCAG certification, Lighthouse, throttled lab, field data or Core Web Vitals claim.

## Screenshot pairs and remaining differences

| State | Reference | Next |
| --- | --- | --- |
| First slide, 390px | [Reference](reference-slide-1-390.png) | [Target](target-slide-1-390.png) |
| Second slide, 390px | [Reference](reference-slide-2-390.png) | [Target](target-slide-2-390.png) |
| First slide, 768px | [Reference](reference-slide-1-768.png) | [Target](target-slide-1-768.png) |
| Second slide, 768px | [Reference](reference-slide-2-768.png) | [Target](target-slide-2-768.png) |
| First slide, 1440px | [Reference](reference-slide-1-1440.png) | [Target](target-slide-1-1440.png) |
| Second slide, 1440px | [Reference](reference-slide-2-1440.png) | [Target](target-slide-2-1440.png) |
| Swipe back, 390px | [Reference](reference-swipe-back-390.png) | [Target](target-swipe-back-390.png) |
| Reduced motion / CTA focus, 390px | [Reference](reference-reduced-focus-390.png) | [Target](target-reduced-focus-390.png) |
| Hover paused, 1440px | [Reference](reference-hover-paused-1440.png) | [Target](target-hover-paused-1440.png) |
| Compact header, 1440px | [Reference](reference-compact-1440.png) | [Target](target-compact-1440.png) |

[RGB comparison](pixel-observations.json) of the six principal pairs found **zero differing pixels** on both 1440px slides and on the second slide at 390/768px. First-slide crops retain **56/292,500 pixels (0.01915%)** at 390px and **12/576,000 (0.00208%)** at 768px, each with maximum channel difference **1/255**. These persisted after restoring animation end styles; their cause is not established. Geometry/text match, but complete pixel parity and owner acceptance are not asserted.

The footer intentionally begins directly after the hero instead of after monitoring → research outputs → trending news → upcoming events. No fake sections were added. The approved entrance correction and interim robots setting are disclosed differences; Task 03's existing exceptions remain documented there.

## Initial payload and review

Final-build `encodedBodySize` totals after images/fonts/entrance were ready, before slide interactions: **JS 138,486 bytes; CSS 7,891; fonts 63,832 at 390/768px or 97,860 on desktop; images 2,786,886**. Chromium fetched **both original hero images on initial load despite the second being lazy**. These are unthrottled local resource-body totals, not total wire bytes or evidence of meeting performance budgets. A separately approved image-optimization task could investigate lossless or demonstrably equivalent variants while retaining exact crops; none are shipped here. PERF-01 remains unachieved.

**Preview URL unavailable from Codex.** The read-only GitHub deployment-status API returned HTTP 403, so no actual branch URL or remote deployment success is verified. [PROGRESS.md](../../PROGRESS.md) records branch publication. No PR or merge is performed. After owner visual acceptance, the one recommended next bounded task is the original monitoring dashboard section; it has not been started.
