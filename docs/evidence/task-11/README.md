# Task 11 — Public accessibility and mobile performance

**2026-10-14 · In review · `codex/task-11-public-hardening`.** Owner explicitly authorised Task 11's A–D exceptions. Base `5b7741080cdc3403099a5f5dfda07ab704850783` includes Task 10 merge `7326c063`. Read-only Laravel stays at `9872c4ed12aa48835eab71065c69b468424adb4a`; its checkout remains clean. No admin, new routes, content rewrites, production settings, PR/merge or historical evidence deletion.

## Changes and exact exceptions

| Area | Scoped change | Preserved / review distinction |
| --- | --- | --- |
| Images | Native server-rendered `picture` with AVIF/WebP width candidates, async decoding, intrinsic dimensions and original fallbacks; 32 variants of eight original homepage rasters | Exact aspect ratios, no upscaling, unchanged text/alt/credits/crops/CSS geometry; original About/logo images and all source files retained |
| Hero discovery | One preferred AVIF responsive preload; first frame high priority, second eager/low; `sizes` reflects original mobile 968px frame; intermediate 2224px second-frame candidate prevents 3336px selection on a 1.75× phone | Slide order, 6s autoplay, 400ms transition, 50px swipe, hover/focus/reduced-motion and approved entrance timings unchanged |
| Cold frame readiness | Native `img.decode()` guard retains the current image/content until the requested raster is ready; superseding selection/disposal cancels pending changes; errors retain a readable frame and hover pauses deferred autoplay | **Loading exception:** an early cold swipe/click can wait for download before transition, replacing the verified source/initial-target blank frame. No spinner, new animation, changed loaded interaction or shortened entrance |
| Contrast | Footer inherited secondary text uses existing `text-tertiary`; meeting badge uses existing dark brand `#0b5025` on its original surface | Only confirmed dark-text failures plus inherited legal separators change; global secondary/brand tokens and icon colours remain intact |
| Names | DOI label starts “Read Here”; news/event full-card links and desktop VIEW MORE use native text names | Original visible copy, destinations, sr-only news context and all date/content-selection rules retained; native card names may be longer for screen readers |
| Focus | Existing Events search input gets solid 2px inset accent focus outline | Keyboard-only indication, same box/form/GET/results; no mobile search redesign or parser fix |
| Navigation | Close glyph uses `hidden` attribute instead of permanent hidden CSS; no-JS native `details/summary` menu exposes the same 18 enabled links and child links; mobile header enters normal flow with offset reset; desktop no-JS About anchors use expanded-header offset +16px | JS drawer geometry/modal/focus trap/Escape/compact states unchanged. **No-JS UI exception:** native expandable navigation in document flow, not a fixed modal; direct headings remain visible |

No new dependency or client boundary. Image generation uses existing Next-installed Sharp (`node scripts/build-public-images.mjs`); AVIF quality 90, 4:4:4, effort 6; PNG WebP lossless / JPEG WebP quality 95. Variants are runtime assets, not migration evidence. Originals remain referenced fallbacks and legacy hash tests remain meaningful.

## Executed verification

Same frozen UTC instant `2026-10-14T12:00:00Z`, original isolated Laravel vendor/build, PHP 8.4.26/native + Carbon clocks; baseline application code is identical to merged main, confirmed by Git diff against Task 10, and copied into its own production server. Next 16.4.0/React 19.3.0/Node 24.19.0, Chromium 154.0.8037.57, en-GB/Africa-Lagos, CSS viewport/device scale 1 unless stated. Full dumps, matrices and traces remain in `/tmp/nosee-task11`.

- **All checks:** 110/110 Node tests (existing 101 retained with narrowly approved expectation changes, nine targeted new cases), typecheck, warning-free lint, final production build and whitespace checks pass. New tests cover real variants/MIME/aspect/fallback/preload, contrast exception, native navigation and deferred decode/cancel/failure/disposal/pause. Focus/native controls also have reusable production browser checks.
- **Responsive/source checks:** 16 page cases × 390/768/1024/1280/1440 × Laravel/main/target = **240 full captures / 160 independent comparison pairs**, including eight regular details, archive, missing event/public routes and search results/empty search. Literal words/URLs/attributes/typography/geometry match except approved name/foreground fields. **Zero changed RGB pixels outside measured photo, changed-text and badge regions** (also existing approved MingCute icon bounds on the Laravel axis). Text ranges use actual line rectangles; no broad masks/dilation/tolerance. This does not claim RGB identity for compressed images.
- **Images/crops:** all 32 variants decode, preserve exact cross-multiplied source aspect and never upscale; original SHA/dimension tests pass. Five-width second-slide captures match frame dimensions/object-fit/position, decoded before display. Raw 7×7 luminance SSIM **0.9785–1.0**, maximum mean absolute RGB error **1.322/255**; scientific first hero ≥0.9940, monitoring ≥0.9970, news ≥0.9946. Photo noise differs after JPEG/modern compression; CSS framing and high-quality representative crops are checked independently. Final loaded hero checks also cover both slides at all five widths and 1.75× phone density: 12 before/after crop pairs, painted SSIM **≥0.994797**, maximum mean RGB error **0.378/255**.
- **Cold early interaction:** two real 1.6Mbps/150ms/4× CPU checks at 1×/1.75×: at the first hydrated selection, second image can still be undecoded; current frame remains visible, and target changes only with a decoded raster. No blank transition in these checks. Broken-image, cancelled-request, disposal and deferred-autoplay pause cases pass in focused tests.
- **Axe 4.14.0:** 14 affected route/width WCAG 2/2.1/2.2 AA scans. Confirmed footer/meeting **contrast violations: zero** (computed footer **7.107:1**, badge **8.416:1**, both ≥4.5); homepage **label-content-name mismatches: zero**, previously 11 desktop/seven mobile. Remaining scans report only excluded indicator target-size findings (home two, About seven mobile/three desktop). No browser errors. Manual NVDA/JAWS/VoiceOver/Orca remains the explicitly separate owner-assisted gate, not completed or a WCAG certification.
- **Keyboard/navigation/focus:** ten JS/no-JS cases at 320/390/768/1024/1440; 30 direct/native-link About anchor checks, minimum **16px heading clearance**; native summary Enter/Space, all 18 links, JS close glyph/open state/focus trap/Escape/focus return pass. Search focus computed solid 2px/-2px offset and native keyboard GET agree. No fallback DOM/style applies with JS.
- **Icons:** 549 actual state samples / **13,080 SVG checks**, 18 enabled/disabled ButtonLink fixtures, zero label/control paint mismatches; eight dark/forced-colour contexts and eight reduced-motion route/width contexts pass. Existing MingCute only/currentColor rules remain.
- **Regressions:** three renderers × mobile/desktop verify indicators/swipe/actual autoplay/hover pause, leadership wrap/swipe/breakpoint groups, navigation, monitoring hover/DOI links and honest newsletter error/no POST/success. Seven search scenarios retain the documented medium parser mismatch. Fresh PHP **99 detail presentations**, nine records/11 missing lookups/escaped optional case agree except the exact authorised meeting badge foreground; existing full listing/date oracle tests pass.
- **Routing/time:** 35 target production checks / 34 matching Laravel comparisons, ten detail deadline/start/end requests, exact HTTP **302 `https://icelli.nosee.org`**, HEAD/query/encoded/slash forms, SSR 404/noindex; **240 same-build homepage/listing/archive/empty-search requests across 20 instants**, timezone/UTC midnight/all-future/all-past preserved. Existing invalid-uppercase source 500→Next 404 retained.

## Repeat performance — same Task 10 profiles

Three alternating fresh-cache runs per version/profile, local HTTP production on the same cloud machine/Chromium; no simultaneous QA. Raw reports remain temporary. Baseline is the newly merged Task 10 application, not an earlier unmerged implementation. These are lab observations/ranges, not field p75 or INP/SLA claims.

| Profile | Main LCP median (range) | Task 11 LCP median (range) | CLS main → target | Other lab observations |
| --- | --- | --- | --- | --- |
| Lighthouse mobile, 1.75× | 15.081s (15.080–15.083) | **3.535s (2.865–4.585)** | 0.003005 → 0.003005 | Score 74→90 median (after 83–95); TBT 49.5→100ms median (after 48–106.97) |
| Lighthouse desktop | 2.573s (2.568–2.588) | **0.898s (0.868–0.938)** | 0.002412 → 0.002412 | Score 86→99; TBT 0→0ms median (after 0–3) |
| Direct CDP mobile, 1× | 18.768s (18.760–18.780) | **2.724s (2.688–2.868)** | 0 → 0 | Complete initial image bodies 3,936,230→415,255B; menus work after load, no runtime errors |

Lighthouse 13.5.0 mobile: default simulated Slow 4G/4× CPU, 412×823 at 1.75× density; desktop: 40ms/10,240Kbps/1× CPU. Direct CDP: 390×844 at 1×, 1.6Mbps down/750Kbps up, 150ms latency, 4× CPU. Preserve animations during benchmarking; do not use reduced motion to inflate reported results. Native automation menu timing is not INP. Field/mobile-device/CDN/live deployment remain unverified.

| Cold homepage body category | Main | Task 11 |
| --- | --- | --- |
| Mobile / desktop images | 3,936,230 / 3,936,230B | **415,255 / 755,373B** (−89.45% / −80.81%) |
| JavaScript | 138,683B | 138,794B (**+111B**, native decode guard; no new boundary) |
| CSS | 11,297B | 11,454B (+157B) |
| Fonts mobile / desktop | 105,240 / 122,216B | Unchanged |
| Requests mobile / desktop | 24 / 25 | 21 / 25 |
| Compressed / decoded HTML | 31,881 / 231,360B | 34,794 / 269,422B (native fallback/responsive metadata) |

Cold payloads use 24 independent fresh contexts with no forced decoding/scroll/interaction, encoded bodies excluding headers/framing. All-route visual sessions separately load lazy images for parity. Local cold fonts stay unchanged with `font-display: swap`. Dynamic HTML remains noindex/nofollow, static About and date-sensitive dynamic routes/Proxy remain unchanged. No asset format/loading/CDN/production setting outside the approved eight homepage images changed.

## Remaining gates / ordered follow-up

- Mobile goal ≤2.5s is **still unmet** in these normal-motion profiles; Lighthouse range is wide and median TBT increases despite much less transfer. Remaining cost includes high-density imagery/AVIF decode and unchanged fonts/framework/entrance; no single-cause or field attribution claimed. Further optimisation/animation/font/framework changes require a separate bounded owner decision; no speculative unrelated changes here.
- Manual assistive-technology/voice control/magnifier/live review, original fixture/DOI/people approval, missing critical destinations, honest newsletter backend and indexing/production decisions remain open. Browser keyboard/AX/axe is not formal accessibility acceptance.
- Explicitly excluded: hero/leadership indicator hit sizes, 320px Events overflow (339px inherited document width), mixed scalar-then-array query parser edge, admin/auth/CMS/new routes/content corrections. No medium issue silently fixed.
- Early cold image selection now waits for decode; loaded controls/durations remain exact. Owner must review this disclosed loading exception and the native no-JS UI.
- Historical evidence retained. All `docs/evidence/` removal stays a separate post-acceptance owner-authorised cleanup PR; reusable tests already live under `tests/`.

## Review triplets / reproduction

| State | Laravel source | Merged main before | Task 11 after |
| --- | --- | --- | --- |
| Hero framing/compression, 390px | [Source](reference-hero.png) | [Before](baseline-hero.png) | [After](target-hero.png) |
| Footer text contrast, 1440px | [Source](reference-footer.png) | [Before](baseline-footer.png) | [After](target-footer.png) |
| Search keyboard focus, 1440px | [Source](reference-focus.png) | [Before](baseline-focus.png) | [After](target-focus.png) |
| No-JS navigation, 390px | [Unusable source](reference-nojs.png) | [Unusable before](baseline-nojs.png) | [Native menu open](target-nojs.png) |

1. `npm ci`; optional deterministic asset regeneration `node scripts/build-public-images.mjs`; `node --test tests/*.test.mjs`; `npm run typecheck`; `npm run lint`; `npm run build`; `git diff --check`.
2. With production server and external Playwright/Chromium/axe available, run `node tests/check-public-hardening.cjs TARGET /tmp/hardening.json /path/to/axe.min.js`, `node tests/check-hero-image-readiness.cjs TARGET /tmp/readiness.json`, and `node tests/check-public-icon-colours.cjs TARGET /tmp/colours.json`. These add no application test route/dependency.
3. `node tests/compare-event-details.mjs /tmp/PINNED_REFERENCE` after PHP activation; `node tests/check-event-routes.mjs TARGET REFERENCE --clock=/tmp/shared-clock`. Use isolated source, original build/vendor, native + Carbon/Node clocks; run clock-changing checks sequentially. Recreate five-width captures at the stated clock and compare actual geometry/paint regions/perceptual crops.
4. Reproduce Lighthouse 13.5.0 profiles and direct network/CPU settings above, three alternating runs each, without other QA. Retain logs outside Git. Four image triplets only; no large JSON exports or trace/browser dumps committed.

Measured iterations resolved a 1.75× srcset gap, retained low priority after higher inactive-image priority worsened LCP, and added decode readiness after a real early-swipe blank was reproduced. Harness corrections covered native scroll-state timing and disabled-JS callback polling; search focus required explicit solid outline rather than only width. Failed runs were corrected/rechecked, not reported as passes. Full screenshot matrices, PHP/browser dumps and all Lighthouse/CDP reports stay temporary; [small measurements/hashes](measurements.tsv) are the committed numeric record.

Publication/actual preview verification is recorded in [PROGRESS](../../PROGRESS.md). No deployment URL is guessed and no release approval inferred. Stop for owner review.
