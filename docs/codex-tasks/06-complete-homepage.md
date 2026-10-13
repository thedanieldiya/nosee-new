# Codex Task 06 — Complete original homepage (research, news, events; strict 1:1)

**Delivery milestone:** P2, finish the three remaining Laravel homepage sections **in one cohesive branch**, without lowering verification standards. This combines the former three task increments, **not** their quality gates.  
**Writable:** `thedanieldiya/nosee-new` — branch `codex/task-06-complete-homepage` from latest `main` after merged [Task 05 PR #5](https://github.com/thedanieldiya/nosee-new/pull/5), merge commit `6bb23ee37382b3431b0082414c56134741a72151`.  
**Legacy source:** `thedanieldiya/nosee` @ `9872c4ed12aa48835eab71065c69b468424adb4a`, **read-only**.  
**Rules:** [PRD strict 1:1 directive](../PRD.md), `AGENTS.md`, [migration map](../migration-map.md), [visual baseline](../visual-baseline.md), [progress tracker](../PROGRESS.md) and prior [Task 04](../evidence/task-04/README.md)/[Task 05](../evidence/task-05/README.md) evidence.  
**Delivery workflow:** Commit + **push task branch only**; owner handles PR/merge. Vercel branch URL only if verified; local testing is the fallback. Stop for the owner's review.  
**Out of scope:** About, events listing/archive/detail routes, `/news`, `/publications` and their detail routes, admin/shadcn, database/CMS/auth, newsletter implementation, new content, logo/hero/nav/footer revisions, image optimization and general refactoring.

## 0. Uncompromising owner direction

**The user explicitly requires a source-faithful 1:1 replica of the existing Laravel public frontend, with no creative liberties, AND has clarified that working faster does not mean sloppy implementation.** Implement three logically related sections in a single task, **but verify each section independently before declaring success**. Match **every source-visible string, capitalization, typographic mark, card count/order, image, crop, size, spacing, breakpoints, destination, hover/focus state, screen-reader-only text and actually working interaction**.

- **No redesign, editorial corrections, invented filler, new loading spinners, added badges, new image types, changed source destinations, new responsive layouts or unauthorized animations.**
- Legacy records are **explicit development fixtures**, not established NOSEE publication/news/event facts. Reproduce the source literally for visual parity, but flag provenance and publication approval in the handoff. Do not add visible “fictional” labels as that would break the source replica.
- Source behavior and pinned renderer take precedence over stale docs or aspirational animations. Task 04's **owner-approved hero-specific six-stage entrance correction** is the only currently approved animation deviation.
- Regression protection is mandatory: do not break the approved navigation/footer/hero/monitoring layout, hero carousel, mobile menu or newsletter exception to complete the new sections.
- Do not silently waive failing tests or screenshot mismatches. Fix them or report precise unresolved blockers. **A successful build alone is insufficient.**

## 1. Inspect the real Laravel templates, repositories, records and tests

Read source files in full, not only summaries:

**Homepage components (three sections + cards):**
- `resources/views/components/home/research-outputs.blade.php` + `resources/views/components/cards/research-output-card.blade.php`
- `resources/views/components/home/trending-news.blade.php` + `resources/views/components/cards/trending-news-card.blade.php`
- `resources/views/components/home/upcoming-events.blade.php` + `resources/views/components/cards/event-card.blade.php`
- `resources/views/pages/home.blade.php`, `app/Http/Controllers/HomeController.php` and `app/Services/Content/HomepageContentService.php`

**Exact selection/business rules:**
- `app/Repositories/Content/{AbstractFileContentRepository,FilePublicationRepository,FileNewsRepository,FileEventRepository}.php`, `app/Services/Content/FileContentLoader.php`
- **All** `content/publications/*.php` (10), `content/news/*.php` (9), `content/events/*.php` (9), and `config/app.php` for PHP timezone defaults; test against the pinned source export. Preserve field values and fixture warnings outside visible UI.
- Date presentation as implemented in Blade (publication year, news `d/m/Y` using record offset, event `d.m.Y` and location formatting).

**Styles and behavior:**
- `resources/css/app.css`, `resources/js/homepage-animations.js` and `resources/js/app.js`; the existing Task 05 `.card-hover-lift` CSS in destination.
- Relevant legacy `tests/Feature/View/{ResearchOutputsSectionTest,ResearchOutputCardTest,TrendingNewsSectionTest,TrendingNewsCardTest,UpcomingEventsSectionTest,HomePageTest}.php` and `tests/JavaScript/homepage-animations.test.js`.
- Original `public/media/trending/{trending1.png,trending2.png,trending3.png}`, source arrow-right icon.
- Existing Next `src/app/(public)/page.tsx`, `src/lib/content/{homepage,monitoring}.ts`, `src/components/site/sections/*`, public `Container`/`ButtonLink`/`ArrowRight`, globals/tokens and evidence renderer setup.

Do not run installs, alter source files or commit to Laravel. Use the pinned isolated Laravel renderer already proven in Tasks 03–05.

## 2. Port data faithfully (not an invented CMS)

Use small, typed, server-side content records and **testable source-equivalent selectors** for each domain. You may copy all source records for correct selection/future route reuse, or the smallest faithful typed input that demonstrably preserves the source homepage selection at the current date **and on date rollover**. Do not fabricate fields. **Output must be verified against a fresh pinned PHP export**, not hand-copied guesses. Retain original slug strings and fixture content.

- **Research outputs:** Source `FilePublicationRepository::featured(3)` filters `featured === true`, orders `publication_date` **descending**, breaks ties with slug **ascending**, takes **3**. Expected initial slugs: `low-latitude-geomagnetic-storm-responses`, `urban-aerosol-optical-depth-patterns`, `satellite-soil-moisture-drought-signals`. Render exact titles, authors joined with comma+space, uppercase research area labels with hyphens changed to spaces, publication year (first 4 date chars), publication source and original `https://doi.org/{doi}` links. Source DOI strings `10.5555/nosee.dev...` are fixtures: do **not** silently replace or claim verified publication availability.
- **Trending news:** `FileNewsRepository::homepageTrending(4)` orders **strict featured first**, then `published_at` ISO strings descending, slug ascending tie break; take **4**. Expected `solar-storm-monitoring-exercise` (featured), then `space-station-instrument-calibration`, `air-quality-smoke-transport-study`, `regional-earth-observation-partnership`. All titles/excerpts/categories/ISO timestamps/images/alts must match PHP. First record is featured; remaining 3 are compact. The fourth **reuses `trending2.png` by source design**—do not invent a fourth image.
- **Upcoming events:** `FileEventRepository::featuredUpcoming(3)` filters `featured === true` and `(end_date ?? start_date) >= today` using **server-local calendar day**. Source Laravel `config/app.php` sets timezone **UTC**. Sort `start_date` ascending, then slug ascending; take **3**. At the current October 2026 baseline: `regional-space-weather-conference` (10–12 Mar 2027), `earth-observation-data-workshop` (21–22 Apr 2027), `atmospheric-measurement-seminar` (14 May 2027). **Do not freeze that snapshot into the build**: if a formerly featured event becomes past, it must disappear as it does in Laravel. Implement date-dependent selection on the server with an explicit UTC “today” (injected or simulated clock in tests); ensure Vercel static prerender caching cannot permanently freeze time-based cards at build time. Preserve the difference between this simple homepage date filter and the richer per-event timezone logic reserved for Events pages.
- Date formatting must match PHP **exactly**, not depend on browser locale or hydration; source news labels use `d/m/Y`, homepage events `d.m.Y`. Homepage event card link for `type === 'meeting'` is `meeting_site_url`; other types use `/events/{slug}`, all with the source's same-tab anchor behavior.
- Focused tests must verify selected slugs/count/order and sorting/tie cases, non-featured exclusion, event past/ongoing boundary and UTC date rollover, title/slug/URL transforms and source record equality. Avoid building a generic cross-domain content framework.

## 3. Recreate Research Outputs visually, with no design changes

Source files: `home/research-outputs.blade.php` and `cards/research-output-card.blade.php`.

- `section.bg-default.py-8.lg:py-16`; heading **“Research Outputs”**, centered mobile and left desktop, `text-[28px] leading-8 font-semibold lg:text-5xl lg:leading-[56px]`.
- Three stacked cards on mobile, `lg:grid-cols-3` desktop, `gap-5 lg:gap-8`, source container/header/action gap; server components only.
- Each source card has `border border-line-soft p-4` on mobile, **no outer border/padding on desktop** (`lg:border-0 lg:p-0`), uppercase research-area label, thin divider, exact title/author/source/year text and spacing. Preserve `h3`/paragraph semantics.
- Source **“Read Here”** DOI action uses `ButtonLink` equivalent **stroke variant and arrow-right**, only displayed at ≥1024px; `target="_blank" rel="noopener noreferrer"` with exact `aria-label` and source spacing. Do not add mobile DOI button.
- `SEE ALL OUTPUTS` is the exact CTA both above-right on desktop and bottom-centered below 1024px, `href="/publications"`. That route remains absent in this task; don't substitute `#`.
- Preserve `data-research-outputs-section` / heading/action/group/item reveal hooks and all original utility classes.

## 4. Recreate Trending News visually, with no design changes

Source files: `home/trending-news.blade.php` and `cards/trending-news-card.blade.php`.

- `bg-surface py-10 md:py-16`, centered heading **“What’s Trending”** with the original **curly apostrophe**, `text-[28px] leading-8 font-semibold md:text-5xl md:leading-[56px]`. **News changes at md (768px), not lg.**
- Source layout: stacked featured square and compact grid through tablet, `xl:grid xl:grid-cols-2` only ≥1280px; compact group `grid-cols-1 md:grid-cols-2`, 3 compact square news cards + fourth `VIEW MORE` action tile shown ≥768px. Mobile uses separate bottom `VIEW ALL NEWS` CTA; exact `/news` routes.
- Featured card has `data-variant="featured"`, `data-mobile-variant="compact"`, mobile title `text-xl leading-7` and ≥768px title `text-[40px] leading-[48px]`. Compact cards keep `text-xl leading-7`. Preserve source responsive placement of date chip: top-right on mobile featured, bottom row on ≥768px featured; compact chip always at top.
- Cards are a single full-article link `/news/{slug}` with precise `aria-label="Read more: {title}"`, image alt, sr-only category + excerpt, gradient **from-black/85 via-black/25 to-black/10**, original image crops and the 300ms hover-scale behavior (disabled under reduced motion). Use source arrow icon, not a substitute.
- Copy the **three** original PNGs to `public/media/trending/` byte-for-byte. Original dimensions: `trending1.png` 642×642; `trending2.png` and `trending3.png` 310×309. Original file sizes: **285,633 / 174,097 / 87,943 bytes**. Verify SHA-256 equality. Do **not** add a fourth image or assume its source record is a mistake.
- Preserve `VIEW MORE` square tile's source background, hover/focus green transition, accessible label and arrangement. Source cards have no required lazy-loading attribute; do not silently change loading semantics in the strict-parity task.

## 5. Recreate Upcoming Events visually and temporally correctly

Source files: `home/upcoming-events.blade.php` and `cards/event-card.blade.php`.

- `bg-default py-8 lg:py-16`; heading **“Upcoming Events”** with original mobile centered and desktop left-aligned typography.
- Three stacked `min-h-[420px]` card links below desktop; ≥1024px three **equal** columns and `min-h-[480px]`. Source grid `grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-8`, card `card-hover-lift` 250ms and reduced-motion behavior already implemented for monitoring.
- Each whole card is a **single native link**, source accessible label, type uppercase with hyphens→spaces, title, entire summary, date/time element **`dd.mm.yyyy` with a ` - ` span for date range**, and venue/place/platform formatting (physical: venue, city, country; hybrid: same + ` + platform`; online: platform). No invented metadata/icons/registration buttons.
- `SEE ALL EVENTS` appears upper-right desktop and bottom-centered mobile, linking to `/events`. Retain source labels, capitalization, action placement, and event detail URLs. The destination page will be built in the Events task; do not create placeholder routes here.
- Preserve `data-upcoming-events-section`, headings/cards/reveal hooks, focus treatment, hover lift and display semantics.

## 6. Source-observed section reveal animation (investigate per section)

The source has `data-reveal-section` hooks and a **declared but possibly ineffective** Motion sequence (in-view 20%, bottom margin -10%, heading 0.55s, item 0.6s stagger 0.07s, action 0.45s). Task 05 recorded **zero actual monitoring animations** in the pinned renderer despite the declaration. The owner specifically approved only the Task 04 hero entrance correction.

At 390px and 1440px in the pinned Laravel renderer, observe scroll-triggered reveal for **each of these three sections**, in normal and reduced-motion modes. If actual motion is absent, preserve the source hooks and fully visible SSR markup **without introducing newly functioning reveal effects**. If any effect actually runs, reproduce it exactly and verify timing. If implementation cannot match without changing an existing approved section, document the conflict and ask the owner; do not silently "fix" all reveal effects. Accessibility/no-JS content must stay readable.

## 7. Complete homepage composition, without inventing missing pages

Update only the public homepage composition to:

`HomeHero` → `HomeMonitoringDashboard` → `HomeResearchOutputs` → `HomeTrendingNews` → `HomeUpcomingEvents` → existing public layout `SiteFooter`.

No extra wrappers/gaps between sections beyond Laravel. Preserve all original shared tokens and previous components. Keep site title `NOSEE` and current `(public)` route group layout.

**SEO:** The root currently has temporary page-specific `robots: {index:false,follow:false}` because it lacks sections. Now all five source sections will exist, but the content still includes unapproved **publication, news and event development fixtures**. **Do not automatically remove noindex or claim publication readiness.** Record this as an explicit owner decision. A visual clone does not make fixture claims true.

**No new routes:** `/publications`, `/news`, `/news/{slug}`, `/events` and event-detail pages remain outside Task 06. It is correct for these original source links to be temporarily unresolved in destination, and they must not be redirected or renamed to evade 404s.

## 8. Quality gates — not negotiable despite batching

This is a combined **three-section** task, not a reduction in test coverage.

1. **Data correctness per section:** Compare full typed records and selected slugs/count/order to a fresh PHP export at the pinned revision, with explicit as-of dates. Test source sorting, selection/featured logic, tie breakers, formats, links, and UTC date boundaries. Verify PNG SHA-256 equality and dimensions.
2. **Visual evidence per section:** Source *and* final Next production screenshots for each of the three sections at **390×844, 768×1024, 1024×768, 1280×900, 1440×1000**. Use identical pinned-renderer environment, viewport, DPR, fonts, date/clock, image settle, and scroll position. Minimum 390/768/1440 captures **per section** if constraints prevent all widths; document omissions, don't claim complete parity.
3. **Responsive/interactions per section:** Verify research's desktop-only DOI button, News feature/compact position and hover image zoom at `md`/`xl`, “VIEW MORE” tile, mobile CTA, events card hover/focus lift, event dates/locations, same-tab/external target behaviors, accessible labels/focus, reduced motion. Capture at least one relevant interactive state each for News and Events; test navigation/links without fabricating routes.
4. **Complete homepage regression:** Once all five sections render, compare **full-page source/target** at 390px and 1440px as well as section crops. Inspect vertical accumulated positioning to catch missing/misaligned spacing. Ensure hero carousel, nav/footer, newsletter, monitoring cards and approved hero entrance remain visually/behaviorally intact at 390/768/1440px. Verify meaningful SSR page with JavaScript disabled; the *already documented* mobile navigation no-JS defect remains tracked, not silently altered.
5. **Automated checks:** Focused Node tests for research/news/event records, selectors and markup (reuse current runner; no new test framework unless essential); `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`. Run once near completion, rerun failures after fixes. Verify the actual built server responds to `GET /` with 200, all homepage sections appear in correct DOM order, all three original news assets return HTTP 200, and no JS console errors or horizontal overflow. If needed, use existing Chromium/Playwright tools; no need for a sprawling source Laravel test suite or blanket snapshots.
6. **Measured quality, not self-report:** Record per-section paired screenshots, RGB/pixel or geometry differences, tested behaviors, automated outcomes and discrepancies in `docs/evidence/task-06/README.md`. Include screenshot files + small structured evidence only when produced. **Never claim full pixel parity or production readiness from successful lint/build alone.**
7. **Performance visibility:** Task 05 observed approximately **3.39MB** of cold mobile image bodies from hero + monitoring. Adding news imagery may increase the cost. Record added image bytes, initial requests, CSS/JS/fonts, and lazy/eager behavior where measurable. Do not change source image semantics or crops without a separately approved zero-visible-change optimization task. `PERF-01` remains open; no fabricated Core Web Vitals claims.
8. **Failure policy:** If a section fails source comparison, fix it before pushing or label the exact unresolved difference. A source fixture's doubtful accuracy, broken destination or missing animation is **not** permission to silently correct content or change visuals. Performance and accessibility defects must stay listed for a dedicated owner-approved corrective task.

## 9. Git, progress and handoff

- Create `codex/task-06-complete-homepage` from merged Task 05 `main`; keep edits limited to three sections/cards, typed content/selectors, original news images, home composition, tests and evidence/tracker docs. No unrelated refactors, no new external libraries, no Laravel writes.
- Update `docs/PROGRESS.md` honestly: Task 05 [PR #5 merged](https://github.com/thedanieldiya/nosee-new/pull/5), with eight pixel-identical comparison pairs; Task 06 **In review** only if its checks and screenshots exist. P2/PUB-01 may reach **In review** once full five-section layout is evidenced, **not Done** until owner accepts full homepage and source discrepancies are resolved/approved. P0 gaps, no-JS menu, newsletter exception, fixture provenance and ≥3.39MB image performance issue remain tracked.
- Commit + push branch. A pushed branch can generate Vercel preview; actual preview URL/status only if checked. Owner will create PR and merge after review, and can test `npm ci && npm run dev` locally. **Do not auto-create PR, auto-merge, edit production, or start About.**
- Final report: branch/commit, six new source mappings (3 sections+3 card types), content selections/date handling, original asset hashes, per-section screenshots and full-page diffs, focus/hover/reduced-motion findings, test/typecheck/lint/build results, added payload, exact deviations and blocked links, tracker state, branch-specific preview URL if verified.
- **STOP after pushing.** Suggested next milestone: **Task 07 — entire original About page** in one cohesive, equally strict migration.

### Acceptance

The Next.js homepage contains **all five sections in their Laravel order**, with exact source copy and records, three research outputs, one featured + three compact news cards, three time-appropriate event cards, original responsive CTAs, hover/focus behavior, source-observed motion, copied original news imagery, automated data/behavior checks, plus independent **source-versus-target evidence for each of the three sections and at least two full-page viewports**. No visual redesign, invented routes or premature production-readiness claim.
