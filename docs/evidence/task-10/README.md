# Task 10 — MingCute icons and final public frontend review

**2026-10-14 · In review · branch `codex/task-10-icons-final-public-review`.** Base `06fb9c7f0543c6ce681ffe709eeb5da7da1bd532` includes merged Task 09 PR #9 (`aad5980`). Laravel `9872c4ed12aa48835eab71065c69b468424adb4a` remained clean/read-only. No PR, merge, admin work, production changes or historical evidence deletion.

## Application change and intentional exception

Exact locked `@mingcute/react@3.0.2` / `@mingcute/icons@3.0.2` (Apache-2.0; React 18/19 peers), verified individual public subpath imports. All glyphs render on the server; no added client boundary or icon runtime in public client chunks. Original photographs, scientific images, logos, copy, URLs, dates and controllers remain unchanged. Eleven obsolete generic SVG assets removed after replacing every runtime reference.

| Original UI purpose | Official MingCute export | Preserved box |
| --- | --- | --- |
| CTA/right and external arrows | `ArrowRightRegular`, `ArrowRightUpRegular` | 16px; original wrapper/rotation |
| Login/account | `User3Regular` | 28px |
| Menu/open, close, submenu | `MenuRegular`, `CloseRegular`, `DownRegular` | 32/32/20px; original hooks |
| Calendar dots, clock | `Calendar2Regular`, `TimeRegular` | 32px; calendar is nearest official alternative |
| Location, search | `LocationRegular`, `SearchRegular` | 20/16px |
| LinkedIn/Facebook/X/Instagram/YouTube | `LinkedinFilled`, `FacebookFilled`, `SocialXFilled`, `InstagramFilled`, `YoutubeFilled` | 24px; original names/URLs |

**Approved differences:** glyph shapes and paint now follow neighbouring text via `currentColor`; icon-only controls inherit their own foreground. Social hover/focus colour moved from the mask to its control; active About submenu control inherits the existing green label colour. No independent icon colours, masks, filters or opacity. Decorative SVGs have `aria-hidden="true"` and `focusable="false"`. Source hidden-close-icon defect retained. Replacement image icons use `max-w-full`, preserving the original cyclic grid sizing and mobile CTA clipping rather than expanding the grid by 16px.

## Executed verification

Frozen baseline `2026-10-14T12:00:00Z`; Chromium 154.0.8037.57, Playwright, CSS pixels at device scale 1, en-GB/Africa-Lagos. Isolated source Git archive uses original vendor/build assets, PHP 8.4.26; destination/baseline use Next 16.4.0 production servers, Node 24.19.0. Bulky reports/logs/screens/harnesses stay in `/tmp/nosee-task10`; [compact measured results and hashes](results.json) contain no oracle dumps.

- **Full visual matrix:** 14 routes × 390/768/1024/1280/1440px × Laravel/merged-main/target = **210 full-page captures**. All eight regular details, both missing-route forms and four principal pages included. **70 comparisons on each axis**, independently checking text/URLs/attributes, typography, colours and element geometry. No runtime errors, failing assets or overflow at these five widths.
- **Actual RGB differences:** 140 full-frame comparisons plus ten normalized interactive-state full-frame comparisons = **150 pairs**, **166,452 changed pixels**, all within the union of measured original/replacement icon bounds; **zero changed RGB pixels outside those frames**. No broad masks, dilation or tolerance. This is intentional icon-only difference, not whole-page pixel identity. State captures add 15 crops and 15 full frames; five source/target crop pairs retained below, each also has zero non-icon changes.
- **Colour:** 1,090 initial SVG checks; **549 state samples / 13,080 SVG checks**, zero mismatches. Actual controls exercise rest/hover/keyboard-focus/active/open/selected; 18 real `ButtonLink` render fixtures cover all nine enabled variants and nine disabled counterparts. Filled/stroked paths match label/control RGB, SVG opacity 1; disabled opacity 0.5 belongs to the whole control. Eight dark/forced-colour contexts pass (icon-only controls use their own native foreground).
- **Fresh PHP:** all nine event records, **99 complete detail presentations**, 11 missing lookups and escaped/optional synthetic Blade case; **29 complete listing/archive/presentation cases** including timezone/DST/ties/search/deadlines; **nine native-UTC homepage cases** compare full selected research/news/monitoring/event arrays. Native PHP day frozen with official libfaketime v0.9.13 (`86b37fde`), alongside Carbon and the Node Date-constructor shim; no renderer code edits.
- **Production HTTP:** 35 target checks / 34 matching Laravel comparisons: exact meeting **302 Location `https://icelli.nosee.org`**, HEAD/query/encoded/slash forms, archive priority, regular details and real SSR 404; ten deadline/start/end requests without rebuild. Additional **20 instants × four pages × three servers = 240 requests** compare homepage/listing/archive/empty-search through UTC midnight and event-local boundaries, all-future/all-past; no rebuild, cache masking or date-selection differences.
- **Interactions:** both widths and all three renderers: hero indicators/swipe/actual desktop autoplay and hover pause; leadership group controls/arrows/wrap/swipe and 639/640/1023/1024/1279/1280px transitions; drawer Enter/Escape/focus return, active submenu and desktop dropdown focus; monitoring lift/links and desktop DOI affordance. Native keyboard GET search works. Target newsletter still shows honest error with **zero POST/success**, preserving the approved exception. Sticky month headings remain 72/104px below compact navigation in all six checks. Eight route/width reduced-motion comparisons pass across all three renderers with no running animation or card lift.
- **Search:** seven original query scenarios plus nine additional blank/trim/zero/array/mixed/repeated scenarios; every merged-main result matches target. Laravel agrees except the pre-existing mixed scalar-then-array family described below. No source copy or parser changes made.
- **Automated checks:** **101/101 tests**, typecheck, warning-free lint, final production build and `git diff --check` pass. Existing 97 cases retained, with only obsolete icon expectations updated; four new icon import/paint/ARIA/control tests. About remains static, date-sensitive routes dynamic, meeting Proxy unchanged.

| Relevant colour pair | Normal | Hover/focus/active | Disabled |
| --- | --- | --- | --- |
| White account/search/filled button; white meeting calendar | `#fff` | Same as control/text | Whole-control opacity only |
| Green CTA and selected About submenu | `#13853d` | Same as control/text | Whole-control opacity only |
| Muted location / ordinary time | `#5c5c5c` / `#171717` | Same as neighbouring text | Not present on these labels |
| Dark footer socials | `#a3a3a3` | `#fff` on hover/focus; active inherits control | Not present |
| Destructive stroke/text fixture | `#e7000b` | Follows existing red-700/red-800 text | Matching paint, shared 0.5 opacity |

## Accessibility and ordered owner decisions

**70 axe-core 4.14.0 WCAG 2/2.1/2.2 AA scans:** Laravel/target at mobile and desktop, plus merged-main desktop. Violation rule/node counts match source and baseline; **no new icon violations**. Browser AX checks expose no decorative glyph images/duplicate announcements. **42 JS-off route/width/server checks** retain readable SSR headings/main/footer and the source menu defect. Eight reflow checks use CSS viewport equivalents of 200/400% zoom, not a screen magnifier. These results do **not** certify WCAG compliance.

| Priority | Verified finding / remaining gate | Smallest proposed action; approval |
| --- | --- | --- |
| High | Local mobile LCP fails 2.5s target; images remain dominant (measurements below) | Separately approve demonstrably equivalent responsive AVIF/WebP, discovery/loading and hero timing work; measure again before claiming readiness |
| High | Footer secondary text contrast **2.68:1** (`#5c5c5c` on `#171717`), three nodes/page; Events meeting badge **4.14:1** versus 4.5 required | Approve bounded token/badge contrast fixes; source colours preserved here |
| High | Homepage accessible-name/visible-label mismatch: **11 desktop / seven mobile**; Events search input has no outline/shadow/form change on focus in all three implementations | Approve label-name alignment and visible input focus treatment; no wording/focus redesign here |
| High | Source no-JS menu/toggle and hidden close glyph; JS-off fragments can hide headings | Approve the separately documented fallback/close-icon/anchor fixes; original defects retained |
| Medium | Hero indicators: two undersized targets; About indicators: three desktop/seven mobile. Events **320px → 339px** document width in all three implementations | Approve hit-area/reflow fixes, preserving visible layout where possible; 390–1440px checks pass |
| Medium | `/events?q=x&q[]=ignored` and `q=x&q[foo]=ignored`: PHP ignores the overwritten array query; both merged main and target filter scalar `x` | Approve a separate PHP-compatible query parsing change; pure arrays/reversed order/last scalar agree |
| Release gate | Placeholder organisation/people/events/news/DOIs, missing `/news`, `/publications`, `/data`, `/login` and linked future pages; old AGM 404 | Owner approves facts/destinations before indexing; existing noindex/nofollow retained |
| Release gate | Manual NVDA/JAWS/VoiceOver/Orca unavailable; external microsites, field CWV/INP and live deployment unverified | Owner performs assistive-technology/live review. [Accessibility skill](../../../.agents/skills/agency-accessibility-auditor/SKILL.md): “Every audit must include both automated scanning AND manual assistive technology testing”; browser AX/keyboard/axe are the completed subset |

Existing approved hero six-stage entrance, honest newsletter error, About gutter/native 1px fragment variation and uppercase invalid-slug Laravel 500 → Next 404 remain disclosed. No unrelated corrections, new routes, subscriptions or production/indexing approval inferred.

## Measured performance

24 independent fresh-context cold payload measurements (no forced decoding, scrolling or interaction), plus all-route settled visual payloads. Encoded body bytes below exclude HTTP framing/headers; HTML is separate, fonts unchanged and `font-display: swap`. MingCute paths occur in server HTML, not a newly hydrated icon bundle.

| Page (mobile / desktop where different) | Main → target JS | CSS | Images | Requests | Compressed HTML |
| --- | --- | --- | --- | --- | --- |
| Home | 138,662 → 138,683 | 11,441 → 11,297 | 3,938,451 → 3,936,230 | 30/31 → 24/25 | 29,091 → 31,881 |
| About | 138,136 → 138,157 | Same | 170,001/980,287 → 167,997/978,066 | 22/26 → 17/20 | 23,264 → 26,461 |
| Events / archive | 137,118 → 137,139 | Same | 23,347/22,068 → 18,717 | 25/26 or 22/23 → 14/15 | 21,825/19,831 → 25,853/22,822 |
| Regular detail / 404 | 137,118/139,106 → 137,139/139,148 | Same | 20,721 → 18,717 | 19/20 or 18/20 → 14/15 or 13/15 | 18,084/12,115 → 20,971/13,899 |

**Lighthouse 13.5.0:** localhost HTTP production, same cloud CPU/Chromium, three alternating cold runs per version per profile, no concurrent QA. Default mobile simulated Slow 4G/4× CPU; desktop 40ms/10,240Kbps/1×. Mobile main → target medians: score **74 → 74**, LCP **14.857 → 15.084s** (ranges 14.855–14.935 / 15.007–15.089), TBT **51 → 44ms**, CLS **0.0030 → 0.0030**. Desktop: score **81 → 81**, LCP **3.486 → 3.424s** (2.625–3.487 / 3.284–3.426), TBT **0 → 0ms**, CLS about **0.0024**. Three runs/ranges are descriptive, not a statistical SLA or field percentile claim; mobile simulated LCP worsens by 227ms and remains a review finding.

**Direct mobile CDP throttling:** 390×844, fresh cache, 1.6Mbps down/750Kbps up, 150ms latency, 4× CPU, three alternating runs each. Main → target hero-image LCP **18.696 → 18.772s** (18.680–18.712 / 18.768–18.776), CLS **0 → 0**. Both menus work after load, no runtime errors. Slow-network first-slide images **2,442,282 → 2,440,061B**: unlike unthrottled/Lighthouse runs, the lazy second hero image is not fetched in this initial window. Original raster bytes unchanged; reductions are obsolete icon requests. The approved animation/loading behaviour is retained. Automation click-to-open 136–160ms is **not INP**. No field/mobile-device/CDN/production performance claim; PERF-01 remains open.

## Representative review pairs and reproduction

| State | Laravel | Next.js |
| --- | --- | --- |
| Active About menu, 390px | [Source](reference-active-menu.png) | [Target](target-active-menu.png) |
| Search-button keyboard focus, 1440px | [Source](reference-search-focus.png) | [Target](target-search-focus.png) |
| Original clipped event metadata, 390px | [Source](reference-event-meta.png) | [Target](target-event-meta.png) |
| Footer social keyboard focus, 1440px | [Source](reference-footer-focus.png) | [Target](target-footer-focus.png) |
| Leadership controls, 1440px | [Source](reference-leadership-control.png) | [Target](target-leadership-control.png) |

1. `npm ci`; `node --test tests/*.test.mjs`; `npm run typecheck`; `npm run lint`; `npm run build`; `git diff --check`.
2. Start production Next. With Playwright/Chromium available, `node tests/check-public-icon-colours.cjs http://127.0.0.1:3016 /tmp/icon-colours.json` reproduces actual colour/control/disabled fixtures without adding a test route.
3. For source checks, archive the exact Laravel pin outside the checkout; reuse its verified vendor/original build. Activate PHP; run `node tests/compare-event-details.mjs /tmp/REFERENCE`. Re-export the retained Task 08 PHP harness/inputs **to `/tmp`**, compare every `presentEvent`/`buildEvents`/`archiveEvents` output. Freeze both native PHP UTC and Carbon clocks when comparing homepage selectors; never run clock-changing scripts concurrently.
4. Recreate the two production versions and pinned renderer at the stated clock/browser/viewports; wait fonts/visible images/entrance/navigation/carousel state, compare literal semantics and full-frame RGB. Compute the union of **actual SVG/legacy icon DOM bounds**, without expanding masks. State crops retain actual scroll/focus; normalized full captures reset scroll and remeasure icon bounds to avoid sticky/compositor capture artifacts. Axe scans use WCAG tags; Lighthouse/direct CDP use the profiles above. Temporary harness/report hashes are in `results.json`.

Reference-server broken stdout initially emitted a logging notice before redirect headers; restarting with file-backed logs restored exact 302, and affected checks reran. Harness-only corrections covered whitespace/hidden metadata, stylesheet readiness, visible grouped indicators and screenshot coordinates; no findings were waived. Owner visual/AT/content/performance review and a **separate authorised evidence-cleanup PR** remain required. Branch publication/preview is recorded in [PROGRESS](../../PROGRESS.md); no preview URL is guessed.
