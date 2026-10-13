# Task 05 monitoring dashboard evidence — 13 October 2026

The original three-card monitoring section now follows the hero. Task 04 was merged in [PR #4](https://github.com/thedanieldiya/nosee-new/pull/4); the owner reports the merged site works locally. This is functional evidence, not formal full-site pixel-parity acceptance. Task 05 is **In review**; research outputs, trending news and upcoming events remain unimplemented.

## Reference and reproduction

Branch `codex/task-05-home-monitoring` starts from main **`a14c59fd5e7b018418fa7f49d3ba3bc04b5e0b13`**, including merged Task 04. Laravel source is pinned to **`9872c4ed12aa48835eab71065c69b468424adb4a`** and remains clean/read-only.

Restored the [Task 03 isolated-renderer procedure](../task-03/README.md#reference-and-capture-conditions): Git archive in `/tmp`, existing `vendor` and `/workspace/cloud-setup/build` symlinks, separate environment/cache/views/storage, array sessions/cache and `APP_NAME=NOSEE`. Started Laravel with the existing activated PHP tools and `php artisan serve --no-reload`. No legacy install, rebuild, source edits or broad tests. This is a pinned local renderer, not verified live production; deployed configuration remains unknown.

Target is the final local Next production build (`npm run build`, then `npm run start`). Existing Chromium **154.0.8037.57** / Playwright, DPR **1**, locale **en-GB**, timezone **Africa/Lagos**, light scheme, no network/CPU throttling. Fonts/original images and hero entrance were settled before measurement. Default motion unless labeled reduced.

At each matching viewport, scroll the section to just below the compact header (72px mobile / 104px desktop). Native Chromium `Page.captureScreenshot` with `captureBeyondViewport` crops the section at its document coordinates, including the complete stacked cards beyond the viewport. No header hiding or source DOM/style changes. Chromium rasterizes the fractional CSS crop heights to integer pixel heights shown in [pixel observations](pixel-observations.json); section geometry retains the fractions below. Full-page diffs are inappropriate because three later sections are absent in Next.

## Source mapping and data/assets

| Source | Destination |
| --- | --- |
| All four `content/data/items/*.php`, `FileContentLoader` lexical order and `FileDataRepository::homepageMonitoring()` | `src/lib/content/monitoring.ts`: typed literal records and strict `homepage_monitoring === true` selection |
| `home/monitoring-dashboard.blade.php` | Server `HomeMonitoringDashboard.tsx`, unchanged Container/ButtonLink primitives and all source reveal/data hooks |
| `cards/monitoring-dashboard-card.blade.php` | Server `MonitoringDashboardCard.tsx`: exact article/title/frame/action/attribution markup and classes |
| `.card-hover-lift` component layer in `app.css` | Only that source block appended to Next `globals.css` |
| Homepage composition | `HomeHero` → `HomeMonitoringDashboard` → layout footer; existing title/main/noindex retained |

The [actual pinned PHP repository export](source-data.json) independently matches all four TypeScript records and the selected three, in order: Average F-Region Observations. → Range Error from TEC → TEC Difference from 30-Day Median. The starter record remains false/excluded. Every field, including summaries not displayed by Blade, is retained. Provider **National Weather Services**, punctuation and source URLs are unchanged. Static source screenshots/links are not verified live scientific data; no API/feed/iframe was introduced.

| Unmodified PNG under `public/media/monitoringDashboards/` | Dimensions | Bytes |
| --- | --- | --- |
| `fRegionObservations.png` | 600×338 | 186,977 |
| `rangeError.png` | 600×338 | 213,836 |
| `tecDifference.png` | 600×338 | 203,079 |

Total **603,892 bytes**. [SHA-256 and dimensions](assets.json) were checked against original bytes and target copies. Original case, `width=600`, `height=338`, `size-full object-cover`, frame padding/borders and eager loading retained. No `next/image`, conversion, `srcset`, lazy attribute or added fetch-priority attribute.

All three external actions retain `Full product`, exact accessible title, `target="_blank"`, `rel="noopener noreferrer"` and `https://www.spaceweather.gov/products/glotec`. Source CTAs remain **ALL DATA** below 1024px / **SEE ALL DATA** at desktop, linking to `/data`. That page remains unimplemented; no replacement route or link is invented.

## Observed motion and focused checks

[Reference reveal observation](reveal-reference.json): at 390/1440px, scrolling into the section in normal/reduced-motion sessions produced **zero monitoring Web Animation calls**. Fifteen 80ms-spaced samples per session kept heading/items/actions at opacity 1 with no transform/translate. Normal source sets its `revealPlayed` marker, but the `motion/mini` sequence does not animate; reduced motion skips registration. Declared intent is a 20% intersection / -10% bottom margin, heading 550ms, cards 600ms staggered 70ms after 150ms, actions 450ms after 250ms. **None is newly activated in Next.** Hooks remain; the source's bookkeeping marker is not synthesized with extra client code. Activating the intended reveal requires separate owner approval; the approved hero entrance is unchanged.

- [Typecheck](typecheck.txt), [lint](lint.txt) without warnings, **[3 native tests passed / 0 failed](tests.txt)**, and **[one production build](build.txt)** passed. Static `/` and `/_not-found` emitted. Tests compare actual PHP exports/selection, render the real server components using installed TypeScript/React and verify image hashes/dimensions. No new dependency, lockfile change or test framework. `git diff --check` and relative documentation links passed.
- [Browser checks](browser-checks.json) matched complete section/card/heading/CTA/attribution geometry, fonts/colors/wrapping, borders, 16:9 frames and loaded 600×338 originals at all five widths. Verified stacked → equal-column layout at 1024px. Target assets returned HTTP 200, no browser errors or horizontal overflow.
- Desktop normal hover and keyboard focus lift **4px**, use the source **250ms** transition and identical shadow. Reduced motion keeps shadow but removes lift and sets `transition-property: none`; its duration value remains 250ms. The first reduced-motion assertion incorrectly expected duration 0s; it was corrected to test the actual disabled property and only interaction checks were rerun. No application correction was needed. At 390px hover/focus remains stationary. Keyboard links show the same 2px accent outline / 2px offset.
- Both renderers expose three readable cards and the mobile CTA with JS disabled. The separate source no-JS mobile-navigation defect remains blocked. Hero first-slide content/heights/inert state, expanded/compact header geometry and footer dimensions match at all five widths. Target normal hero still makes seven approved entrance element calls. Shell/hero/footer files, primitives, tokens and existing controllers are unchanged; target footer follows monitoring directly.

| Viewport | Padding top/bottom | Card width | Section CSS height |
| --- | --- | --- | --- |
| 390×844 | 40px | 358px | 1194.75px |
| 768×1024 | 40px | 720px | 1781.625px |
| 1024×768 | 64px | ~298.667px | 556.875px |
| 1280×900 | 64px | ~362.667px | 584.875px |
| 1440×1000 | 64px | 416px | 614.875px |

## Actual paired captures

| State | Laravel | Next |
| --- | --- | --- |
| Section, 390px | [Reference](reference-section-390.png) | [Target](target-section-390.png) |
| Section, 768px | [Reference](reference-section-768.png) | [Target](target-section-768.png) |
| Section, 1024px | [Reference](reference-section-1024.png) | [Target](target-section-1024.png) |
| Section, 1280px | [Reference](reference-section-1280.png) | [Target](target-section-1280.png) |
| Section, 1440px | [Reference](reference-section-1440.png) | [Target](target-section-1440.png) |
| Desktop hover | [Reference](reference-hover-1440.png) | [Target](target-hover-1440.png) |
| Desktop keyboard focus | [Reference](reference-focus-1440.png) | [Target](target-focus-1440.png) |
| Reduced-motion hover | [Reference](reference-reduced-hover-1440.png) | [Target](target-reduced-hover-1440.png) |

**All eight RGB pairs have zero differing pixels** in these captured regions. This does not certify other pages/states or replace owner visual acceptance.

## Initial transfer evidence and remaining scope

New cold browser contexts, before scrolling/interacting, reported encoded subresources: **JS 138,486 bytes; CSS 8,218; fonts 80,884 mobile / 97,860 desktop; images 3,390,778**. Relative to recorded Task 04: unchanged JS, CSS **+327**, mobile fonts **+17,052** (used heading weight), images **+603,892**. Monitoring PNGs alone report **603,892 encoded / 604,792 browser transfer bytes**. Cold mobile HTML reports **16,337 encoded / 117,469 decoded / 16,637 browser transfer bytes**; document bytes are separate from subresource totals. Browser `transferSize` is not a complete wire accounting.

Both hero originals and all three eager monitoring PNGs load on initial mobile entry. React/Next automatically emits image-preload links for the eager monitoring images (observed initiator `link`); Blade discovers them through image markup. This framework discovery-order difference is disclosed; the original image attributes/files and eager semantics are unchanged. There is no new monitoring client component or runtime dependency. These unthrottled local totals do **not** meet or prove low-bandwidth/CWV goals. A separate owner-reviewed, zero-visible-change performance task is needed; no optimization is authorized or shipped here.

Remaining: three homepage sections, `/data` and other public routes, source no-JS nav blocker, full original-page baseline/live configuration and formal full-site review. Existing Task 03 newsletter exception and Task 04 approved entrance/color observations remain documented there. No admin/backend/membership or new reveal animation. No broad Laravel/E2E suite, new browser install, screen-reader/WCAG certification, Lighthouse, throttled audit or field/CWV evidence.

[PROGRESS.md](../../PROGRESS.md) records commit/publication and any verified branch preview. No PR or merge. Stop for review; the one next bounded task after acceptance is the original **Research Outputs** section.
