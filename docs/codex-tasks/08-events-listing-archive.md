# Codex Task 08 — Events listing, GET search and archive (strict 1:1)

**Milestone:** P3 Events frontend, first of two cohesive Events tasks. Migrate **both `/events` and `/events/archive`** in one branch, with the complete source listing/search, featured/ongoing/upcoming groups, date/time presentation, archive and empty states. Task 09 will migrate `/events/{slug}` detail, meeting redirects and original 404 handling.  
**Writable repo:** `thedanieldiya/nosee-new`; branch `codex/task-08-events-listing-archive` freshly created from **latest `main`**, including the owner's merged [Task 07 PR #7](https://github.com/thedanieldiya/nosee-new/pull/7), merge commit `c6c45b00e4182e2279a82ca1e568f66973ac133c`.  
**Read-only authority:** `thedanieldiya/nosee` at pinned commit `9872c4ed12aa48835eab71065c69b468424adb4a`.  
**Project rules:** `AGENTS.md`, `docs/PRD.md` (owner's literal 1:1 requirement), `docs/migration-map.md`, `docs/visual-baseline.md`, `docs/PROGRESS.md`; [Task 06 homepage evidence](../evidence/task-06/README.md) and [Task 07 About evidence](../evidence/task-07/README.md) for the isolated pinned Laravel renderer / finished Next production comparison.  
**Workflow:** Codex implements, checks, **commits and pushes a task branch**, provides evidence and stops. Owner creates/merges PR. A Vercel preview URL is optional only if actually verified; local builds/browser captures are essential regardless.  
**Out of scope:** Events detail or meeting redirect route, external site, new search/filter UI, news/publications/research/data routes, admin/shadcn/CMS/backend, content corrections, homepage/About redesign, unrelated refactors or silent accessibility/performance fixes.

## 0. Owner quality contract: faster does not mean sloppy

Produce an **exact 1:1 replication of what the pinned Laravel source actually renders and does**, including content, source fixtures, selection semantics, markup geometry, typography, status colours, borders, widths, date labels, links, hover/focus, sticky headings and responsive show/hide rules. The two related pages are in one task **only to reduce handoffs**, never to waive either page's separate tests, cross-width screenshots and state comparisons.

- Do not rewrite source copy, tidy odd behavior, invent imagery or filters, replace event cards with generic tiles, or “improve” search semantics. Follow the **Blade templates + `EventListingService.php`**, not imagined event-site conventions.
- All nine source event records in `content/events/*.php` are **development fixtures**, not verified public NOSEE events. They already exist as literal typed `src/lib/content/events.ts` records. Retain exact data, including fictional event descriptions, case and URLs, with an explicit publication-approval warning in evidence; do not inject an extra visible “demo” badge.
- Do not equate the homepage's simple UTC featured filter with the listing's **per-event timezone and time-of-day state machine**. These deliberately differ; preserve both.
- Known source accessibility/content quirks are documented, not silently corrected under an unspecified approval. No source animation beyond observed behavior or unrelated navigation/footer changes.
- If any screenshot/state cannot be matched, disclose the exact measured discrepancy instead of claiming “pixel identical.”

## 1. Inspect source and destination before writing code

**Pinned source:**
- `routes/web.php` and `app/Http/Controllers/EventController.php`; route names, `GET /events`, `GET /events/archive` and `GET /events/{slug}` ordering, trimming/query semantics and detail boundary.
- **All 370 lines** of `app/Services/Events/EventListingService.php`, especially `build`, `archive`, `present`, `state`, `sortKey`, `featured`, `matchesQuery`, `groupByStartMonth`, `groupArchive`, `formatTime`, `dateParts`, `formatLocation` and `formatApplicationDeadline`.
- `app/Repositories/Content/{FileEventRepository,AbstractFileContentRepository}.php`, `config/event-types.php`, `config/app.php`, all **nine** `content/events/*.php`.
- `resources/views/events/{index,archive}.blade.php` and four components `resources/views/components/events/{featured-event,listing-event-card,day-group,month-heading}.blade.php`; note exact Tailwind classes, conditional DOM and semantic elements.
- `resources/views/layouts/app.blade.php` and `components/ui/{container,button,arrow-right}.blade.php`; original expanding header offset for **ordinary pages** (not hero overlay).
- `resources/css/app.css` for the pre-existing `.card-hover-lift`; original exact SVG bytes `public/media/icons/{search.svg,arrow-up-right.svg,CalendarDots.svg,Clock.svg,MapPin.svg,arrow-right.svg}` and all associated active/inactive styles.
- `tests/Feature/{EventsPageTest,EventArchiveTest}.php` and `tests/Unit/Services/Events/EventListingServiceTest.php` (the baseline uses frozen clocks and mock events).
- Reference/browser instructions in Tasks 05–07 evidence.

**Destination:**
- `src/app/(public)/layout.tsx` and `src/app/(public)/about/page.tsx` (About-only expanded header offset is already established), page metadata, `src/components/site/layout/{SiteNavigation,NavigationLink,SiteFooter}.tsx`.
- `src/lib/content/events.ts` (**all nine literal records already match PHP**) and `src/lib/content/homepage-selections.ts` (**must keep its existing homepage behavior unchanged**).
- Existing `Container`, `ButtonLink`, `ArrowRight` and global CSS/theme/fonts, tests. Reuse byte-identical icon files already present. Copy the additional SVG assets using exact original case only where missing.

**Do not modify or install dependencies in the Laravel repository.** Source captures must use an isolated pinned Git archive and the already available vendor/build resources (see Task 07 evidence). The unavailable live website is not the reference; clearly identify the pinned local renderer.

## 2. Implement date-sensitive source-equivalent Events presentation

Create a small testable module (e.g. `src/lib/content/events-listing.ts`) that uses **existing typed `eventRecords`**. Keep `Date`/`now` injectable in pure testable selectors, but **obtain the current instant at each server request**; do not freeze listing/archive groups at build time, cache the first request forever, or derive classification from the browser's timezone. Ensure `/events` and `/events/archive` are dynamically rendered as appropriate for Next.js 16.

### State machine (per event; NOT the homepage filter)

Port `EventListingService::state` exactly:

- For `type === 'meeting'` or `schedule.mode === 'multi_day'`: convert current instant to **event.timezone**, compare that local **calendar date** to `start_date` and `end_date ?? start_date`. Before start → `upcoming`; after end → `past`; start through end **inclusive** → `ongoing`.
- Other single-day events: interpret `start_date + schedule.start_time` in **event.timezone**. End is local end-of-day if `schedule.end_time` is null, otherwise `start_date + end_time` in event timezone. Before start → upcoming; after end → past; exact instants at boundaries → ongoing.
- Include synthetic timezone/offset tests for date boundaries, before/start/exact end/after, single-day open-ended, meeting/multi-day crossover and DST where relevant. Source nine records happen to use `Africa/Lagos` but selectors must preserve their timezone field, not hardcode Africa/Lagos or assume UTC days.
- The homepage `selectFeaturedUpcoming` stays unchanged and continues to use the source-specific UTC calendar filter.

### Listing selection, sorting, search and grouping

- Present **all nine** records, partition into `ongoing` and `upcoming` (past absent from listing), then sort each **ascending** by `start_date + (regular single-day start_time or '00:00')`, tie by slug ascending, matching PHP `strcmp` (not locale-sensitive collation).
- Select `featured` **before search**: first sorted **upcoming** event whose `featured === true` and `type === 'meeting'`; otherwise **first upcoming record** even if `featured=false`. The featured card remains **also in its month/day listing** (intentional duplication, no dedup). It can be absent if no future events.
- At the real Oct 2026 source baseline, `icelli2026` (18–20 Nov 2026) is the **first upcoming fallback featured event despite its `featured=false`**; its image is **null**, so render source's exact gray placeholder `#d9d9d9`, not a fabricated image. Confirm by running the pinned PHP oracle at a recorded instant, do not trust fixture summaries alone.
- `q` comes from native **`GET /events?q=...`** search; PHP controller accepts a **string only**, trims it, and treats blank as null. Case-insensitive substring match over exactly: title, summary, type, location.venue/address/city/country/platform and organiser. Do **not** include slug, speaker, full body, event date or unrelated fields.
- **Search filters only the upcoming list**, *not* the featured item or ongoing events. The featured choice is unchanged if the query finds no upcoming match. This counterintuitive behavior is a required part of parity. No search results means the **upcoming empty-state message**, not a fabricated whole-page “no events” state.
- Group filtered upcoming records by **start-date month `YYYY-MM`** (label `F Y`), then start-day `YYYY-MM-DD` (label uppercase `dd MMM`); events crossing months appear only under **start month**, no duplication into end month.
- Search is **desktop-only `lg:flex` (≥1024px)** as in Blade. Do not add a mobile search form, dropdowns or clear buttons. Use a real HTML form `method="GET" action="/events"` with native `name="q"`, label, search icon and original button. Server GET submission must work with JS off, trim/refill the query correctly and escape it safely. No client search overlay or API call required.
- The source search form is not on the archive. Do not add archive searching or category filtering.

### Archive selection and formatting

- `GET /events/archive` includes **past events only**, excluding ongoing/upcoming based on the **same per-event state machine**. Sort **descending** with the reversed PHP comparator (start date/regular start-time descending; tie slug **descending**). Group into descending **year → month → day** buckets **by start date**, with source `YYYY-MM` keys and headings as shown in Blade.
- If no past events, show exactly `No archived events are available yet.` with original border/margins. **Do not carry past application deadlines into archive cards** (source `present(...includePastDeadline=false)` returns null for past).
- Main event list may show future deadlines as `Apply before: F j, Y at g:i A` or `Applications closed` after the deadline. Compare instants using the event timezone and original ISO offset.
- Format all dates/time/locations exactly as PHP/Carbon; meeting vs nonmeeting external URL behavior and meeting labels are preserved. Include fixtures/synthetic tests for physical/hybrid/online locations, time with/without end, date range ending in another month/year and deadline future/closed.

## 3. Reproduce `/events` source UI (complete listing)

Create `src/app/(public)/events/page.tsx`, server-rendered, title **`Events | NOSEE`**. Keep **temporary page-specific `robots: { index:false, follow:false }`** because source event fixtures are unapproved; the invisible SEO exception must be documented. Use About's already measured **expanded-header offset** for ordinary internal pages without changing the homepage or adding a second nav.

Source `events/index.blade.php` composition must be exact:

1. `data-events-page` outer `events-listing pb-20`; Container `flex flex-col gap-10 pt-10 lg:gap-16 lg:pt-6`.
2. Header: **“Events”** `h1 40/48px→lg48/56px`, exact editorial subtitle. Native search form hidden below `lg`, **416×48px** on desktop, border/pr-1/pl-4, original `Search` button and `/media/icons/search.svg`.
3. If `featured` exists, source `FeaturedEvent` card before ongoing/upcoming. Responsive `lg:grid-cols-[minmax(0,415px)_minmax(0,1fr)_191px]`, source min-height, image region; when `image=null` show source flat gray empty block (no placeholder illustration or alternative text). Exact “Featured event” label, linked title, summary, outlined CTA (external text **`Explore {title}`**, internal **`View details`**), date blocks, map pin and location.
4. Only if ongoing nonempty: `data-ongoing-events` heading **“Ongoing Events”**, original border/padding; cards indented `lg:pl-[336px]`. **Ongoing is NOT filtered by `q`**.
5. `data-upcoming-events` heading **“Upcoming Events”** and outline **`View event archives`** link to `/events/archive` with right arrow, **hidden below `sm=640px`** (not `lg`). Original border/spacing.
6. If no filtered upcoming groups: exactly **“No upcoming events found.”** and only if query nonblank, **“Try a different search term.”** under it.
7. Else month sections with `data-event-month`, `EventMonthHeading` **sticky** `top-[var(--compact-navbar-offset)]`, and `EventDayGroup` label/date header, 304px date-column at desktop, 32px gap. Source sticky behavior must be tested both with navbar compacting on scroll and when the month changes.
8. Use `ListingEventCard` for rows without altering original 191px / flexible / 191px three-column desktop layout. It shows a duration panel, event type/tag, title/summary, map pin and **desktop-only CTA**, plus conditional application deadline row. Mobile rows stack; source order/height/borders/line wraps apply.

The exact source date/type configurations (`config/event-types.php`) MUST survive: meeting brand/white; conference purple; workshop orange; lecture blue; training sky; outreach rose; non-meeting duration surface/primary. Duration icon: `CalendarDots.svg` for meeting or multi-day; `Clock.svg` for timed single-day. Meeting calendar icon brightness/inversion must match Blade.

Keep `card-hover-lift` behavior and focus outlines as already ported in Task 05. Do not introduce new slide/reveal effects, image conversion, rounding or shadows not in source.

## 4. Reproduce `/events/archive` source UI

Create `src/app/(public)/events/archive/page.tsx`; page title **`Event Archives | NOSEE`**, temporary page-specific `noindex,nofollow` and ordinary expanded-header offset.

- `data-event-archive-page` `pb-20`, Container `pt-10 lg:pt-6`.
- Exact heading **“Event Archives”** and subtitle, responsive sizes.
- Populated hierarchy: year section `data-archive-year`; source `h2` with bottom border and **32/36px→lg40/48px**; nested month sections `data-archive-month` with original `h3` **28/32px→lg32/36px**, day groups and the **same source `ListingEventCard`**.
- Empty hierarchy uses only original centered bordered message. Archive has no desktop search form, no manufactured pagination and no sorting/category filter.
- Preserve group spacing `mt-10 lg:mt-16`, gaps, type chips/date panels, external meeting new-tab links and focus. No deadlines shown for past events.
- Do not create `/events/{slug}` pages or redirects here; Task 09 is exclusively responsible. Preserve the original internal links `/events/{slug}` even if they temporarily 404 and document them honestly.

## 5. Shared event components/links and original SVGs

Implement small server components under `src/components/site/events/` for the four source Blade components (`FeaturedEvent`, `ListingEventCard`, `EventDayGroup`, `EventMonthHeading`), and keep presentation/data helpers narrowly scoped in `src/lib/content/`. Existing UI primitives can be used where their output is identical; don't add dependencies or a generic events framework.

- Preserve native `<a>` semantics, target/rel behavior: **meeting = `meeting_site_url` external `target="_blank" rel="noopener noreferrer"`** for listing/featured; regular events = `/events/{slug}` same tab. Source CTA icons **`arrow-up-right.svg`** vs **`arrow-right.svg`**, exact titles and labels. **Homepage** meeting cards intentionally differ and must remain unchanged.
- Reproduce source use of `<time datetime>`, original accessibility labels, focus rings, tag capitalization and image alt. Do not add extra accessible names that change source behavior unless needed by the existing validated Next conventions and visually invisible; document exception.
- Copy missing exact **SVG** files `search.svg`, `arrow-up-right.svg`, `CalendarDots.svg`, `Clock.svg`, `MapPin.svg` into `public/media/icons/` with the correct case, paths and **byte-for-byte SHA-256** from pinned source. Existing `arrow-right.svg` must remain unchanged. Verify HTTP 200 for all originals.
- Existing literal event records `src/lib/content/events.ts` must remain equal to the nine source files. **No CMS, remote API, time externality or new image downloads**.

## 6. Quality gates — independent per route/state, not just build green

**Temporal/data test matrix:**
- At a pinned, explicitly recorded source-and-target instant (e.g. **2026-10-14 12:00:00 UTC**), compare complete source PHP `build()` and `archive()` JSON outputs (or carefully scoped equivalent export) against new TypeScript presentation and grouping output. This is more than title/count spot checks.
- Use **identical frozen time in Laravel runtime and Next production request**; merely setting Chromium timezone/clock is **not sufficient**. If isolated PHP clock override is necessary, use an isolated harness without modifying the pinned legacy repo, or test with injected clock and report which page captures use real live time.
- Test at least: baseline, case-insensitive/trimmed `?q=Lagos`, `?q=impossible-no-match`, blank `?q=%20%20`, non-string array `?q[]=x`; no-results messages; featured/ongoing unaffected; featured first meeting/fallback and duplicate appearance; all future → archive empty; past/ongoing edge boundaries; inclusive local date/time at event timezone; closed/future application deadline; duplicate start-time/slug tie ordering; archives past-only descending year/month/day; cross-month start group; no forged external registration.
- Verify per-request **time rollover without rebuild** for BOTH `/events` and `/events/archive` using a fresh server request with controlled clock; no stale Next prerender/CDN cache. No change to homepage's separate UTC featured selector.
- Native `GET` search and routes must work with JavaScript disabled. Query string must be safely escaped in HTML and must not produce a script injection.

**Browser visual matrix:**
- **Five widths:** **390×844**, **768×1024**, **1024×768**, **1280×900**, **1440×1000**. Paired *pinned Laravel* and *built Next* captures with identical fonts/DPR/locale, date/time, fixed header state and scroll position.
- Capture **`/events` baseline** and **`/events/archive` populated** at all five widths (each independently checked). Save **full-page pairs at 390px and 1440px** and key region crops (featured, month/day group, event row, archive year header) at representative breakpoints.
- **Additional distinct states:** desktop query with results; query with no results; ongoing subsection under controlled date; future/closed deadline variant; archive-empty state; ≥1024 desktop search control focus/GET submit; ≥640 archive link; compact navbar plus sticky month heading; hover/focus lift/reduced motion; external meeting tab target; regular link. Capture state-specific pairs instead of duplicating baseline screenshots pointlessly.
- Validate per page scroll/heading offsets and direct-link `GET`, original image/SVG HTTP 200, computed typography/line breaks/cards/border and exact `sm/lg` breakpoints. Browser console no unexpected errors, no horizontal overflow; source-driven fixed nav still supports mobile drawer and desktop state on both pages.
- Verify homepage five-section and About full-page **regression** at 390 and 1440 (reuse prior reference/captures and CSS check). Existing hero carousel and About seven-profile carousel behavior must not regress. Homepage cold image payload must not grow through Events imports.

**Focused tests and release checks:**
- Add small Node tests for selectors/formatters/state boundaries/URL+DOM semantics; reuse current test runner. Do not add a large runtime dependency or third-party UI library.
- Run `npm run typecheck`, `npm run lint`, focused new + relevant existing tests, `npm run build`, `git diff --check` near the end; rerun failures after fixes. Verify built `GET /events`, `GET /events?q=...`, `GET /events/archive` return 200 **and actual SSR content**, not just route status.
- Record each actual capture, pixel/geometry diff, API/HTTP/pagination (none) and test results in **`docs/evidence/task-08/README.md`**. Include machine-readable state selection comparisons and real screenshot files. No invented “100% parity,” Core Web Vitals or unverified preview URL.
- Document any source quirks and differences (no mobile search, no archive link at <640px, featured not searched, placeholder image, fixtures, unresolved event detail links, no-JS menu, source-side newsletter exception, `noindex`, hero-specific animation deviation). Separate future correction proposals from this task.
- Record measured cold Events CSS/JS/font/icons/media bytes and whether the About-only controller stays out of Events; comparison must not claim performance budget success from file sizes alone.

## 7. Progress update and stop

1. Branch from latest merged Task 07 `main`. Preserve all existing public pages/shared shell. No writes to pinned Laravel.
2. Update `docs/PROGRESS.md`: [Task 07 PR #7](https://github.com/thedanieldiya/nosee-new/pull/7) merged; 44 paired pixel-identical source/target comparisons and 50 passing focused tests were reported. **PUB-02 remains In review** pending owner's final content/indexing/accessibility signoff. Mark Task 08/Event listing+archive **In review only after its evidence exists**. P3/PUB-03 **In progress**, not Done until Task 09 event details/redirects and explicit acceptance.
3. Keep mobile nav no-JS defect, newsletter behavior, About native 1px fragment variance, unapproved fixture/editorial content, `noindex`, incomplete news/publications/other public URLs and ≥3.94MB homepage initial images flagged. No source “corrections” without owner authorization.
4. Commit, **push branch** and stop. No PR or merge automatically, no domain or production changes. Actual Vercel branch preview URL only if verified; otherwise provide GitHub branch URL/local run instructions.
5. Final response: branch/full SHA, source-to-target mapping (two pages/four card components/service), baseline + search + archive + date-rollover results, per-state screenshot comparisons, tests/build, SVG hashes, regression checks, retained discrepancies/performance, progress status and optional verified preview.
6. **STOP for owner review.** Next **Task 09** will cover the original `/events/{slug}` detail frontend, meeting external 302 redirect, unknown-slug 404, and final existing-route integration; **do not start it automatically**.

### Acceptance

Both original Events pages are source-faithful, fully server-rendered and operable without JS: desktop `GET` search, featured/ongoing/upcoming sections, correct event-local time-sensitive status and deadlines, original grouped sticky upcoming list, archives grouped newest-first with no past deadlines, exact card layouts/icons/links and conditional empty states. Source/target page+state screenshot evidence, an executable temporal oracle, focused tests and no regressions are mandatory. **A merged PR alone will not be treated as verified public launch readiness.**
