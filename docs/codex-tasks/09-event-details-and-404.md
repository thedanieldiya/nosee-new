# Codex Task 09 — Event details, meeting HTTP 302, and source 404 (strict 1:1)

**Goal:** Complete the last existing Laravel public route: event detail pages, external meeting redirects, unknown-slug 404 and the shared source 404 view. **No new public sections/pages beyond the actual Laravel routing inventory.**  
**Source:** read-only `thedanieldiya/nosee` at `9872c4ed12aa48835eab71065c69b468424adb4a`.  
**Writable:** `thedanieldiya/nosee-new`, new `codex/task-09-event-details-404` branch from latest `main` after [Task 08 PR #8 merged](https://github.com/thedanieldiya/nosee-new/pull/8), commit `5a15a55b787de75934eef5d015cd5b8e40ce95fe`.  
**Read first:** `AGENTS.md` (including **token-efficient evidence and final cleanup** policy), relevant `docs/PRD.md`, `docs/migration-map.md`, `docs/visual-baseline.md`, `docs/PROGRESS.md`, and only relevant source/destination code.  
**Owner's rules:** Literal 1:1 public-site visual/content/interaction parity; **faster or lower token usage must not weaken QA**; no creative changes or premature data corrections. Commit and push task branch, **do not create PR/merge**. Owner reviews and merges. No admin/CMS/news/publications routes, content edits, site redesign, dependencies or unrelated refactors.

## 1. Exact source and existing reusable implementation

Inspect these pinned Laravel files **completely**:
- `routes/web.php`, `app/Http/Controllers/EventController.php`, `app/Services/Events/EventDetailService.php`; `EventListingService::present` and state/itinerary/deadline helpers.
- `resources/views/events/show.blade.php` (163 lines), `resources/views/errors/404.blade.php` (11 lines), `resources/views/layouts/app.blade.php` and used original button/container/icon primitives.
- `tests/Feature/EventDetailTest.php`, relevant `tests/Unit/Services/Events/EventListingServiceTest.php`, all nine `content/events/*.php` and `config/event-types.php`.
- Original source rendered pages for regular single-day and multi-day events, missing-slug 404 and meeting external redirect. Use the **isolated pinned local Laravel renderer**, not the Vercel domain, with synchronized clock for date-dependent pages.

Reuse existing Next modules rather than reimplementing date/time logic: `src/lib/content/events.ts` already has all nine exact source records; `src/lib/content/events-listing.ts` already exports **`presentEvent(event, now, includePastDeadline)`** and the event type palette. Existing `/events` and `/events/archive`, expanded internal-page nav offset, buttons and source `/media/icons/arrow-up-right.svg` are already merged. Search `src/app/(public)/` for current route/layout conventions and reuse them. Do not reread or regenerate Task 08's 39,881-line source oracle: relevant methods, source records and focused tests suffice.

## 2. Functional routing, data and HTTP status

- Create `src/app/(public)/events/[slug]/page.tsx` for **regular** event records. Look up the exact slug (no fuzzy/normalized substitute) in the existing typed records; use `presentEvent(record, new Date(), true)` so **past application deadlines remain visible** (as “Applications closed” when appropriate). Render per request; don't permanently freeze event state/deadline at build time. Correct dynamic `<title>` is **`{event.title} | NOSEE`**. Keep page-specific **noindex,nofollow** until real organisation-owned content is approved; no visible fixture banners.
- For **meeting** records, source `EventController::show` returns **HTTP 302** `Location: {meeting_site_url}` with **no local event detail markup**. Next's default `redirect()` can emit 307/303 instead of 302; use the least intrusive supported **actual HTTP 302** mechanism (e.g. Next config redirect with explicit 302 status, or a narrowly matched Next 16 Proxy), verified on the **production build**. Source URL must be the existing record's HTTPS `meeting_site_url`; do not visit/fetch the external microsite. `GET /events/icelli2026` is an important regression case.
- For **unknown** slug, call Next's actual not-found path and **respond 404**, not 200 with a missing-data card. Preserve missing redirect/slug behavior even if the hero's old AGM link `/events/nosee-annual-general-meeting` points to no source event. Do not invent that event or silently redirect it.
- Add the original public `404` view (in the appropriate App Router not-found boundary, with source shared navigation/footer and correct expanded header offset) for unmatched public routes too. It has document title **“Page not found — NOSEE”**, only a heading **“Page not found”**, and original Container `pt-10 pb-16 lg:pt-6`. Confirm HTTP 404 for known missing slug **and** a nonexistent public URL, including with JS disabled. Route grouping must not duplicate the nav/footer or put content under fixed header.
- `/events/archive` must remain ahead of `[slug]` in routing; verify archive still renders normally.
- No fake `/publications`, `/news`, `/data`, `/privacy`, member-login routes or admin pages. The missing routes stay source-consistent 404 until explicitly approved future work.

## 3. Literal regular-detail page structure

Port `resources/views/events/show.blade.php` as a server-rendered editorial page with source DOM semantics/classes/typography/geometry. Source order:
1. `article.pb-20` with `data-event-detail-page` and computed `data-event-state="upcoming|ongoing|past"`; internal expanded-navbar header offset, `Container pt-10 lg:pt-6`.
2. Bordered header: original coloured uppercase event-type tag, exact title h1 (40/48 mobile, 56/64 at lg) and summary.
3. Event-information grid `sm:grid-cols-2 lg:grid-cols-4` with conditional Date, Time (hidden entirely if null), Location and Application fields. Preserve per-event timezone label, date range punctuation, en dash time separator, location format, the source “Apply before” line break and closed deadline behavior.
4. Optional external **REGISTER** button **only if `registration_url` exists**, using original `ButtonLink` variant/size/arrow-up-right SVG and `target="_blank" rel="noopener noreferrer"`. No fabricated action.
5. Main two-column desktop content: “About this event” raw body as **escaped text** with `whitespace-pre-line`, preserving literal source text/line breaks; **never** inject record body as untrusted HTML. Source's synthetic script payload must display safely as text.
6. Conditional multi-day **Itinerary** with `ol`, `li data-itinerary-day`, date/time `<time datetime>` semantics, original long-form date and title/description variants, including rows without title.
7. Conditional **Resources** external links (target/rel and source SVG), preserved ordering.
8. “Event people” aside: Organiser always, Speakers only if present; exact borders, stacking, spacing and source typography.

Do **not** invent speaker cards, rich text formatting, video blocks, image banners, appointment signup, related events, or date badges. The original detail page does **not** render a hero/banner even if an event image field exists. Use the original colour/type palette and existing server helpers without changing listing/archive/homepage presentation.

## 4. Quality gates stay comprehensive; Git evidence stays small

**Source logic** — Targeted pure tests and local PHP reference comparisons: all regular event slugs; meeting 302 exact Location; missing slug 404; archive 200; state and deadline rollover on **fresh production requests without rebuild**; past and future deadline presentation; all three location types; single-day null-time and multi-day itinerary/clock semantics; optional Resources/Speakers/Register; source string escaping and external link attributes. Reuse the 90 previous Task 08 tests without modifying them. Document the frozen instant for comparisons and avoid PHP/browser clock drift.

**Browser** — Run matching pinned Laravel vs **built Next** at **390, 768, 1024, 1280, 1440** px. Compare representative full and cropped states: a regular multi-day itinerary event (`/events/environmental-data-training`, five days), regular single-day event (`/events/community-sky-observation-day`), a past/future application deadline, an event with/without register/resources, and the source 404. Compare the **page geometry, RGB pixels, focus, mobile/desktop nav/header offset and reduced motion**. Validate the direct missing slug and external redirect as **HTTP metadata**, not screenshots of a remote URL. Retest representative original homepage, About, listing and archive routes including at least mobile/desktop; preserve nav/footer, hero carousel, research/monitoring and About carousel behavior. Use JS-off checks where meaningful and record the previously documented **source no-JS navbar defect** separately, not as a new Task 09 redesign.

**Build:** run focused native Node tests plus existing regressions, `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check`. Confirm real production `GET` HTML/status/headers and no console errors or horizontal scrolling. Do not overabstract or introduce dependencies. Fix mismatches, or report exactly what remained different; a green build is not a visual gate.

**New token/evidence policy from owner (also in AGENTS):**
- Keep **full QA execution**, including all useful five-width/state comparisons and date-boundary checks.
- Generate complete screenshots, raw PHP-oracle output, large logs and browser dumps **in ephemeral workspace or CI artifacts**. **Do NOT track complete raw outputs in Git**; no repeat of Task 08's `+54k` evidence diff. Review/compute aggregate results in code and report compact counts, exact deviations and a short reproducible command list; only ingest targeted slices into model context.
- Commit `docs/evidence/task-09/README.md` **briefly** (ideally ≤120 lines), minimal reusable test code under `tests/`, and **at most 4–6 strategically chosen source/target screenshot pairs** (or just a small manifest with hashes if captures aren't useful). Avoid extra tracked JSON files larger than about **50 KB** without explicit owner consent. The exact cap is a storage guide, **not permission to skip needed comparisons**. Tests should remain reproducible through source files and retained runtime tests.
- Existing Task 01–08 evidence is left untouched **now**; **after the entire current Laravel public port and final acceptance**, a later **separate scoped cleanup PR** must remove **all `docs/evidence/` artifacts, images, generated reports and disposable harnesses** from the current repository. Preserve functional tests, the minimal PRD/tracker/README/AGENTS/decisions and working site. Git history is **not** rewritten. Do not perform cleanup in Task 09, and do not import evidence into production bundles.

## 5. Track, push, stop

- Work only in `codex/task-09-event-details-404` from latest main with [Task 08 PR #8 merged](https://github.com/thedanieldiya/nosee-new/pull/8). Keep source Laravel read-only, and all frontend pages unchanged except the new routes/boundary and narrowly necessary route/config wiring.
- Update `docs/PROGRESS.md`: Task 08 merged; detail/redirect/404 code **In review only after checks/evidence**, P3/PUB-03 remain In review until owner approves parity/content; no complete source-port approval merely from merging. Keep source fixture/noindex, no-JS menu, ~3.94MB homepage image transfer and external dependencies listed. Note the owner-approved **token-efficient QA and post-acceptance evidence deletion** requirement.
- Commit, push branch; **no PR, auto-merge, production or domain changes**. Report the actual preview URL only if verified.
- Provide concise final summary: task SHA, pages/statuses, code files, comparisons executed/representative evidence, passing tests/build, exact differences/blocked destinations and the upcoming final source-port review.
- **STOP**. Next owner-reviewed milestone: **Task 10** comprehensive frontend parity/performance/accessibility/source-fixture acceptance. Evidence cleanup happens **only after** owner signs off the completed port.

### Acceptance

Real regular event pages render the exact Laravel detail content and responsive layout, meeting paths return **302** (not 307), unknown paths respond with source-like **404** inside the shared public shell, existing routes remain unaffected and comprehensive *executed* comparisons/tests support the report. The committed diff stays small even if exhaustive QA runs locally.
