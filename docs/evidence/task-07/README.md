# Task 07 — complete About-page evidence

**13 October 2026. Task 07 / PUB-02 In review; P3 In progress.** Task 06 was merged in [PR #6](https://github.com/thedanieldiya/nosee-new/pull/6); P2/PUB-01 remain In review. This branch implements the complete original About page, preserving its development copy and all responsive differences. No Events/admin/backend work or automatic PR/merge.

## Reference and reproduction

Branch `codex/task-07-about-page` starts at main **`ec81802c9fad56a50d2fae84590a6465c2099169`**, including Task 06 merge **`5f36500ee5b658be22eff45e89de1de637069588`**. Read-only reference: Laravel **`9872c4ed12aa48835eab71065c69b468424adb4a`**. Publication/implementation commit is recorded in [PROGRESS](../../PROGRESS.md).

Read the complete About Blade page, carousel Blade/JS/JS tests, PHP content/controller/service/feature test, shared layout/primitives/CSS/app JS/navigation, migration documentation and previous shell/homepage evidence. Recreated a fresh pinned Git archive under `/tmp/nosee-task07-reference.*`, isolated `.env`, storage/views/cache, generated local key, `APP_NAME=NOSEE`, locale en and array sessions/cache. Existing vendor and `/workspace/cloud-setup/build` assets reused; no legacy edits/install/rebuild/test suite. The local configured renderer is not verified live production.

Reproduction follows [Task 05](../task-05/README.md#reference-and-reproduction): source `/workspace/cloud-setup/activate.sh`; archive the SHA; link existing vendor/build; create isolated Laravel runtime directories/environment. **Run PHP from the archive's `public/` directory** with `php -S 127.0.0.1:8002 -t . ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`. Check actual `/about` HTML, not just status. Build Next, then `npm run start -- --hostname 127.0.0.1 --port 3013`.

Existing Playwright/Chromium **154.0.8037.57**; DPR 1, en-GB, Africa/Lagos, light scheme, zoom 1, normal motion except labeled reduced. No CPU/network throttling. Await fonts, relevant visible images, initialized carousel, expected expanded/compact navigation mode and all navigation/track transitions. Compare source and final production server, same state/viewport. Native document-coordinate CDP crops cover tall sections without source DOM/style changes. First-load leadership uses fresh pages and viewport-fitting locator screenshots to preserve its untouched initial state. Full pages restore the expanded header. Cold payloads precede scrolling; image reuse is counted separately below. Helpers ran in `/tmp`; structured results and actual captures are committed here.

## Source mappings and literal content

| Laravel source | Next.js |
| --- | --- |
| `content/about.php`, About controller/service | [readonly literal About export](../../../src/lib/content/about.ts); static `/about` server page |
| `about/index.blade.php`: intro, mission/objectives, quote, story, collaborations | [AboutPageContent](../../../src/components/site/about/AboutPageContent.tsx), original section order/DOM/classes/variants |
| `components/about/profile-carousel.blade.php` | [ProfileCarousel](../../../src/components/site/about/ProfileCarousel.tsx), seven server-rendered figures and original controls |
| `profile-carousel.js` | [native DOM controller](../../../src/components/site/about/profile-carousel.ts), tiny route-only effect with disposal |
| Layout's non-overlay main padding | About-only expanded-offset wrapper; shared layout/homepage untouched |
| Source button/icon API | Optional icon-only sizes/arrow class; existing defaults unchanged and tested |
| Source navigation current/active state | Small [pathname link/submenu boundaries](../../../src/components/site/layout/NavigationLink.tsx); shell/controller/URLs/design retained |

[Fresh PHP export](source-data.json) equals **every** typed value: three intro and mission variants, two closing statements, three objectives/two descriptions each, quote/John Doe, story development copy, seven ordered placeholder profiles and original action URLs. No text correction, invented portraits or added reveal. Three profile images are reused. Native pictures switch at 1024/1280; quote image stays hidden below 1024; original image attributes/crops/lazy behavior retained. Page title **About NOSEE | NOSEE**; temporary **noindex,nofollow** is the task-required invisible publication exception.

Verified initial navigation defect: existing server markup always used `/`, falsely highlighting home on `/about` without JS. `usePathname` in only the link/submenu boundaries supplies correct **SSR and client-navigation** state; the entire shell/page remains server content. Installed Next 16.4 guides confirm this behavior. Native anchors remain without prefetch. Homepage pixels and default primitive output are unchanged.

## Six unchanged media

[Full source/target SHA-256 manifest](assets.json); all six serve HTTP 200 with matching bytes/natural dimensions.

| PNG under `/media/about/` | Natural size | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| earth-space-environment-mobile.png | 370×260 | 149,280 | `ea3c2109e3430125a54c3b2fcd610d8578e1293167cca0120b3e4cf0199ec00e` |
| earth-space-environment-tablet.png | 591×360 | 279,329 | `12f0ec9928e47effad9af7b8b30035519f063c01babc4b116bb12dd36ca186c4` |
| earth-space-environment.png | 864×400 | 458,044 | `b9d0251459be10abd8e31ebc27fe1e2c58a18d0e657be17efe4bd28dbf9000c2` |
| solar-observation-tablet.png | 296×320 | 93,620 | `725de2179931a5607040cb903ccb81292d9a8feb0f7c548892389194cd4c5343` |
| solar-observation.png | 416×330 | 106,358 | `bc398c1fa18f209edf74a0890b2f97c27affa9dad03ef4eca7d3391f35b97cfe` |
| earth-from-space.png | 468×430 | 394,947 | `ddc765dee8a91bf6ded3160df7c5fa1582ce4c8ef579b3842e5ec2c3e03dbba9` |

Total **1,481,578 file bytes**, not initial transfer. Original story HTML remains 752×500 despite its smaller natural image. Also copied Laravel's unchanged **empty `/favicon.ico`** (0 bytes; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`), resolving an inherited browser 404 without adding an icon design. Restarted the built server so its public-file inventory includes it.

## Independent visual comparisons

Each cell links **source / target**; viewport heights 844/1024/768/900/1000 respectively.

| Section | 390 | 768 | 1024 | 1280 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Intro | [S](reference-intro-390.png) / [T](target-intro-390.png) | [S](reference-intro-768.png) / [T](target-intro-768.png) | [S](reference-intro-1024.png) / [T](target-intro-1024.png) | [S](reference-intro-1280.png) / [T](target-intro-1280.png) | [S](reference-intro-1440.png) / [T](target-intro-1440.png) |
| Mission/objectives | [S](reference-mission-390.png) / [T](target-mission-390.png) | [S](reference-mission-768.png) / [T](target-mission-768.png) | [S](reference-mission-1024.png) / [T](target-mission-1024.png) | [S](reference-mission-1280.png) / [T](target-mission-1280.png) | [S](reference-mission-1440.png) / [T](target-mission-1440.png) |
| Quote | [S](reference-quote-390.png) / [T](target-quote-390.png) | [S](reference-quote-768.png) / [T](target-quote-768.png) | [S](reference-quote-1024.png) / [T](target-quote-1024.png) | [S](reference-quote-1280.png) / [T](target-quote-1280.png) | [S](reference-quote-1440.png) / [T](target-quote-1440.png) |
| Story | [S](reference-story-390.png) / [T](target-story-390.png) | [S](reference-story-768.png) / [T](target-story-768.png) | [S](reference-story-1024.png) / [T](target-story-1024.png) | [S](reference-story-1280.png) / [T](target-story-1280.png) | [S](reference-story-1440.png) / [T](target-story-1440.png) |
| Leadership | [S](reference-leadership-390.png) / [T](target-leadership-390.png) | [S](reference-leadership-768.png) / [T](target-leadership-768.png) | [S](reference-leadership-1024.png) / [T](target-leadership-1024.png) | [S](reference-leadership-1280.png) / [T](target-leadership-1280.png) | [S](reference-leadership-1440.png) / [T](target-leadership-1440.png) |
| Collaborations | [S](reference-collaborations-390.png) / [T](target-collaborations-390.png) | [S](reference-collaborations-768.png) / [T](target-collaborations-768.png) | [S](reference-collaborations-1024.png) / [T](target-collaborations-1024.png) | [S](reference-collaborations-1280.png) / [T](target-collaborations-1280.png) | [S](reference-collaborations-1440.png) / [T](target-collaborations-1440.png) |

| Complete/state view | Source / target |
| --- | --- |
| Full About, 390 | [S](reference-full-about-390.png) / [T](target-full-about-390.png) |
| Full About, 1440 | [S](reference-full-about-1440.png) / [T](target-full-about-1440.png) |
| Untouched first leadership, 390 / 768 / 1440 | [S390](reference-leadership-first-load-390.png) / [T390](target-leadership-first-load-390.png); [S768](reference-leadership-first-load-768.png) / [T768](target-leadership-first-load-768.png); [S1440](reference-leadership-first-load-1440.png) / [T1440](target-leadership-first-load-1440.png) |
| Last group, 390 / 768 / 1440 | [S390](reference-leadership-last-390.png) / [T390](target-leadership-last-390.png); [S768](reference-leadership-last-768.png) / [T768](target-leadership-last-768.png); [S1440](reference-leadership-last-1440.png) / [T1440](target-leadership-last-1440.png) |
| Desktop one-step next / keyboard focus | [S next](reference-leadership-arrow-next-1440.png) / [T next](target-leadership-arrow-next-1440.png); [S focus](reference-leadership-arrow-focus-1440.png) / [T focus](target-leadership-arrow-focus-1440.png) |
| Mobile native touch swipe | [S](reference-leadership-swipe-390.png) / [T](target-leadership-swipe-390.png) |
| Reduced-motion last group | [S](reference-leadership-reduced-last-1440.png) / [T](target-leadership-reduced-last-1440.png) |
| Unchanged full homepage, 390 / 1440 | [S390](reference-full-homepage-390.png) / [T390](target-full-homepage-390.png); [S1440](reference-full-homepage-1440.png) / [T1440](target-full-homepage-1440.png) |

**88 screenshots / 44 source-target RGB pairs: all zero differing pixels.** Two additional comparisons against merged Task 06 homepage PNGs are also identical: **46/46 comparisons**. [Unmasked pixel results](pixel-observations.json). [Geometry/styles](browser-checks.json) match every descendant in all six major regions (18/29/11/7/59/9 nodes) at all five widths, including line wrapping, image candidates, ARIA, borders, grids and spacing. Page heights match **6514 / 5912 / 4302 / 4574 / 4519px**; no cumulative offset or horizontal overflow. No screenshot parity claim for untested pages/live deployments.

## Controls, navigation, checks and observed discrepancies

[Full interaction results](interaction-checks.json), [every visible indicator/full arrow wrap](all-controls.json), [action hover/focus](collaboration-actions.json): 1/2/3 visible profiles, 7/4/3 dots, group jumps, one-profile arrows/both wraps, partial last window, 8px dots/labels/current, visible/inert slides, Enter/Space/focus, native CDP touch both directions/wrap, exact 50px boundary, short/equal/vertical/nonprimary/cancel exclusions, tablet swipe exclusion. Preserve index 4 across 639/640/768/1023/1024/1279/1280/1440/390; offsets/picture variants match. Normal transform is 400ms ease-in-out; reduced motion sets transition property none (retains the source's duration value). Virtual 6500ms idle check shows no autoplay. Client `/`→`/about`→`/`→`/about` preserves document, correct highlights, removes detached-carousel listeners and remounts once at index 0.

All three fragment URLs and mobile auto-open submenu/link-close/overflow behavior tested at 390/768/1440. **JS-enabled headings clear the compact header.** One direct 768px leadership result was **127px source / 128px target** (document Y identical 3386px). [Twelve fresh repeat loads](anchor-repeat.json) show source 127/128, and **both no-JS renderers 127/128**. This native first-load variance remains recorded; no speculative 1px compensation. No-JS fragment headings can be covered by the retained expanded header (tablet 264px); the source no-JS menu/close-icon defect also remains. All six readable sections and seven profiles exist in no-JS SSR; this is not a no-JS navigation/accessibility pass.

[First-load observations](first-profile-observations.json) preserve the source's initial **−16/−24/−64px** track offsets at 390/768/1440. After control/resize, track-relative offsets can normalize the first group to zero. Both states were independently captured; no source carousel correction. About has **zero Web Animations calls** and no new reveals. The existing homepage hero approval does not apply here.

[Homepage regressions](homepage-regressions.json): 390/768/1440 geometry, manual hero/phone swipe, drawer/submenu/Escape/focus return/overflow, desktop dropdown and compact header pass. Footer geometry/pixels unchanged. Target synthetic newsletter shows existing error with no request or success dialog. No About controller in homepage JS. All asset responses 200; final browser errors/warnings empty.

**[50 focused tests, zero failures/skips](tests.txt)** (17 new, 33 existing), [typecheck](typecheck.txt), [lint without warnings](lint.txt), [one production build](build.txt) pass. `/about` static, `/` dynamic, not-found static. No dependency/lockfile/token/global stylesheet edits; existing homepage/footer/controllers unchanged. Diff whitespace and evidence links checked; no broad PHP suite/framework install/WCAG/Lighthouse/CWV claim.

Resolved findings: native SSR tests exposed quoted image expressions and boolean data hooks; corrected to actual source attributes. Missing Tailwind candidate separation omitted XL objective padding, producing a **5px** downstream offset; fixed before build. Removed three unused lint suppressions. Test resolver maps Next's extensionless navigation import to its actual Node module. Reference router initially ran from the wrong directory; actual markup readiness failed despite HTTP 200, then public-directory startup verified. Capture checks now await mode changes and track transitions, use source `href` selectors and treat same-document hash navigation correctly; absent legacy robots metadata and duplicate `/data` selectors are handled accurately. These harness failures were corrected and affected checks rerun. Next dev's auto-appended AGENTS guidance was verified/read, then only that generated block removed after stopping dev; canonical instructions unchanged.

## Performance, limitations and review

[Measured accounting](performance-observations.json): unique six-file catalogue **1,481,578** bytes. Cold mobile loads only About mobile intro **149,280**; total image bodies including shared logo/icons **170,001**. Cold 1440 loads desktop intro, solar quote and story **959,349** About bytes; all images **980,287**. After scroll, mobile's four unique PNG URLs total **1,108,629**; desktop stays **959,349**, reusing three profile images. Do not multiply reuse by seven profiles. Repeated ResourceTiming encoded bodies include reuse: PHP reference sometimes retransfers originals, whereas Next repeated entries have **300-byte** revalidation transfer values. This local static-server cache difference and timing are recorded, not a live-network equivalence claim. Raw encoded-entry sums are not wire totals.

Target cold About: **JS 138,197; CSS 10,337; fonts 105,240 mobile / 122,216 desktop**; 22/26 requests; HTML **19,190 encoded / 135,243 decoded** bytes. React preloads shared logo; the native intro picture's selected original is high priority, other source loading behavior unchanged. Home images/fonts unchanged; homepage JS **138,723 (+237)** and CSS **10,337 (+1,245)** versus Task 06. Homepage cold image bodies remain **3,938,451**. No optimization or budget/CWV success claim; PERF-01 open.

Remaining gates: owner visual acceptance, unapproved mockup/John Doe/leadership/organisation claims and indexing, native fragment variance, retained no-JS navigation/fragment defects, newsletter safety exception, source/live configuration and performance. `/participate`, `/partnerships`, `/support`, Events, news/publications/details and other linked pages remain unimplemented; original destinations retained. No automated PR/merge/production settings. Stop for review. Suggested Task 08 after acceptance: original Events listing/search and archive, with complete temporal/state verification.
