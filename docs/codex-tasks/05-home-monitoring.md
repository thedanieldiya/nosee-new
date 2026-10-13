# Codex Task 05 — Homepage monitoring dashboards (strict 1:1)

**Phase:** P2, third bounded increment: **the Earth-Space Environment Monitoring Dashboard section only**, directly beneath the previously migrated hero.  
**Writable repository:** `thedanieldiya/nosee-new`. Create `codex/task-05-home-monitoring` from the latest `main`, which includes **merged PR #4** (Task 04 hero).  
**Legacy reference:** `thedanieldiya/nosee`, commit `9872c4ed12aa48835eab71065c69b468424adb4a`, **read-only**.  
**Source-of-truth docs:** `AGENTS.md`, `docs/PRD.md` (owner's strict 1:1 rule), `docs/migration-map.md`, `docs/visual-baseline.md`, `docs/PROGRESS.md`, and the [Task 03](../evidence/task-03/README.md)/[Task 04](../evidence/task-04/README.md) screenshot and runtime procedures.  
**Delivery workflow:** Commit and push the new branch; **do not create a PR or merge automatically**. The owner will test it locally or through Vercel and handle the PR/merge. Provide an actual Vercel branch preview URL only if it is verified.  
**Scope excludes:** changing the hero, shell, footer, newsletter, About/Events/data routes, research/news/events homepage sections, CMS, admin/shadcn, authentication, backend, new content, site redesign, and general image optimizations.

## Absolute visual/content parity instruction

**This migration is an exact translation of the current Laravel implementation, not a reinterpretation.** Preserve all section text, markup structure and reading order, original visual assets and filenames, spacing, colors, shadows, font families/weights, responsive rules, buttons, linked targets, focus/hover behavior and observed animation behavior. **No creative liberties, copyediting, accessibility redesigns, content normalization or changed image crops.**

Treat the *implemented pinned Laravel site and actual locally rendered reference* as authoritative when older requirements/tests suggest something else. Keep content oddities (including the provider name `National Weather Services`, trailing punctuation in the first card title and source's mobile-vs-desktop button wording) exactly as-is. Mark potential factual/content corrections as owner decisions instead of silently fixing them.

**Do not confuse copying source records with verifying they are real scientific/live data.** These are source-owned static screenshots and external links; this task does not fetch or manufacture live dashboards.

## 1. Inspect actual source and current implementation

Read the following pinned Laravel files **in full**:

- `resources/views/components/home/monitoring-dashboard.blade.php`
- `resources/views/components/cards/monitoring-dashboard-card.blade.php`
- `resources/views/pages/home.blade.php`
- `app/Repositories/Content/FileDataRepository.php`, `app/Repositories/Content/AbstractFileContentRepository.php`, `app/Services/Content/FileContentLoader.php`, `app/Services/Content/HomepageContentService.php`
- **All four** `content/data/items/*.php` records, including `starter-environmental-dataset.php` with `homepage_monitoring=false`; verify source sorting/filtering.
- `resources/css/app.css`, especially the `.card-hover-lift` component layer and reduced-motion rules.
- `resources/js/homepage-animations.js`, `resources/js/app.js` and `tests/JavaScript/homepage-animations.test.js` for source section-reveal hooks and actual behavior.
- `tests/Feature/View/MonitoringDashboardSectionTest.php`, `MonitoringDashboardCardTest.php`, and `tests/Unit/Services/Content/MonitoringDashboardContentTest.php`.
- Exact original media in `public/media/monitoringDashboards/` (capital D).
- Current Next `src/app/(public)/page.tsx`, `src/app/(public)/layout.tsx`, `src/app/globals.css`, `src/styles/tokens.css`, `src/components/site/sections/HomeHero.tsx` and `src/components/site/ui/{Container,ButtonLink}.tsx`.
- `docs/evidence/task-04/README.md` and `docs/evidence/task-03/README.md` for the already working isolated pinned Laravel renderer and local Next production renderer.

**Do not modify, rebuild or install dependencies into the legacy repository.** If local original-image bytes cannot be copied safely, record the blocker rather than substituting illustrations/screenshots from elsewhere.

## 2. Translate the exact monitoring data and selection contract

The original `FileDataRepository::homepageMonitoring()` loads `content/data/items` in **lexically sorted filename order**, then retains only records where `homepage_monitoring === true`.

The three visible source records, in exact order, are:

1. `average-f-region-observations` — **Average F-Region Observations.** — `/media/monitoringDashboards/fRegionObservations.png`
2. `range-error-from-tec` — **Range Error from TEC** — `/media/monitoringDashboards/rangeError.png`
3. `tec-difference-from-30-day-median` — **TEC Difference from 30-Day Median** — `/media/monitoringDashboards/tecDifference.png`

All three have `provider='National Weather Services'`, `ownership='external'` and `source_url='https://www.spaceweather.gov/products/glotec'`. **Transcribe the exact `title`, `summary`, `image_alt` and all other source fields directly from the respective PHP files**, not from the short summary above.

A fourth source record (`starter-environmental-dataset`) has `homepage_monitoring=false` and **must not render**.

- Add a **small typed literal** under `src/lib/content/` following existing conventions. Preserve field values, boolean flags and lexical selection exactly. A short export of all four records plus a strict `=== true` filter is acceptable; **no speculative generic PHP parser, file loader, CMS or database**.
- Do not mutate provider names, change capitalization, expand abbreviations, invent dates, replace images with remote live feeds, or create links to new URLs.
- Copy the **exact three original PNG files, unchanged**, to `public/media/monitoringDashboards/`, preserving path case and filenames. Verify hashes/byte equality with pinned source. Original dimensions are all **600 × 338**; original sizes are **186,977 / 213,836 / 203,079 bytes**, respectively (total **603,892 bytes**).
- Use source record selection in a focused test, including the exclusion of the starter record and order of the three cards.

## 3. Reproduce the monitoring section markup and layout, literally

Implement minimal server-only `HomeMonitoringDashboard` and `MonitoringDashboardCard` components (names may follow local conventions), using the existing site `Container` and `ButtonLink` where rendered output matches Blade exactly. Preserve Tailwind class-level visual behavior:

### Section and header

- Section: `bg-surface py-10 lg:py-16` with `aria-labelledby="monitoring-dashboard-heading"`, `data-monitoring-dashboard-section` and `data-reveal-section`.
- Source container and `flex flex-col items-center gap-6 lg:gap-12`.
- Header `flex items-center justify-center lg:justify-between w-full`.
- Heading `EARTH-SPACE ENVIRONMENT MONITORING DASHBOARD`, as a real `h2` with `font-heading text-xl leading-6 font-medium lg:text-[28px] lg:leading-10`, centered, `data-reveal-heading`.
- At **≥1024px**, the existing right-side CTA is `SEE ALL DATA` linking to `/data`, `px-6 tracking-[0.06em]`, and `data-reveal-actions`. Preserve even the original odd `data-research-outputs-desktop-cta` attribute.
- Below 1024px the source CTA appears after cards as **ALL DATA**, also `/data`; it is `block lg:hidden`. Do not render a visible desktop CTA and mobile CTA together. Use source buttons rather than changing wording.

### Three cards and responsive layout

- Source card group `flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-8`, with `data-monitoring-dashboard-cards` and `data-reveal-group`; items stay in source order.
- Each item has `card-hover-lift w-full lg:min-w-0 lg:flex-1` and the original neutral child wrapper (`h-full`, `data-reveal-item`); cards are equal-width at desktop, **not a 1.5:1 asymmetric grid**.
- Card outer article: `overflow-hidden border border-line-soft bg-default`, source `h-full w-full` plus `data-monitoring-dashboard-card`.
- Card heading wrapper `p-4` and `h3` with `break-words font-heading text-base leading-6 font-medium tracking-[-0.02em] text-[#0b5025]`. Keep exact title spelling including the first title's period.
- Preview frame `aspect-video overflow-hidden border-y border-line-soft px-2`; original `img` with the exact `src`, `alt`, `width=600`, `height=338`, `class="size-full object-cover"`. Do **not** switch to `next/image`, WebP/AVIF, remote dashboards, different crops, or add lazy-loading attributes without separate owner authorization. The source does not declare `loading="lazy"`.
- Bottom source row `flex flex-wrap items-center justify-between gap-x-2 gap-y-1 p-4 text-xs tracking-[-0.02em]`.
- Native external `Full product` anchor uses `target="_blank"`, `rel="noopener noreferrer"`, `aria-label="View full product: {exact title}"`, and `shrink-0 bg-brand px-2 py-1 leading-4 text-inverse` plus source accent focus treatment. Keep its source target unchanged.
- Source right-aligned attribution is `Provided by: National Weather Services` with `min-w-0 flex-1 break-words text-right text-secondary`. Preserve exact position/wrapping and no additional buttons/badges/metadata.

### Desktop hover and focus lift

The source `resources/css/app.css` defines **.card-hover-lift**:
- Transition **250ms**, reduced motion removes transition.
- At `min-width:64rem` only, `:hover` and `:focus-within` translate upward **4px** and add `shadow-lg shadow-black/10`.
- Reduced-motion preference cancels translate lift.
- Port the exact necessary component CSS into `src/app/globals.css` in its appropriate Tailwind layer **without affecting the already approved header, hero or other controls**. Verify the lift visually on mouse hover and keyboard focus. Do not add new scale/zoom/glow/rounded corners.

### Source reveal hooks and actual behavior

The monitoring Blade markup has `data-reveal-section` / `heading` / `group` / `item` / `actions` attributes and `homepage-animations.js` describes an intersection-triggered reveal: 20% in view with viewport bottom margin -10%, heading 0.55s, items 0.6s staggered 0.07s after 0.15s, actions 0.45s after 0.25s. **Read those source specifications**, but **do not assume the declared sequence actually runs**: Task 04 established that the legacy hero's Motion call had no observed entrance animation and required *separate owner approval* to activate its six-stage sequence.

For this task, **test the monitoring reveal in the pinned Laravel renderer by scrolling into the section in both default-motion and reduced-motion sessions**:
- If the source visibly performs a reveal, reproduce that **actual** behavior and exact timings with minimal homepage-only code, no broad hydration or new dependencies.
- If the source does **not** perform a visible reveal, preserve the source hooks and **do not independently activate a new animation**. Record the inactive intended behavior as a future approval question.
- **The owner's hero-specific entrance correction does not authorize activating broken/inactive animations in other sections.**
- Regardless of interaction, the section is fully readable in SSR and when JavaScript is disabled; don't hide content awaiting scripts.

## 4. Home page composition and strict task boundary

Edit `src/app/(public)/page.tsx` to render:

`HomeHero` → `HomeMonitoringDashboard` → the existing shared `SiteFooter` (footer comes from the public layout).

This intermediate composition is expected: the source actually continues with **research outputs → trending news → upcoming events**, which are **not part of Task 05**. **No blank placeholders or fabricated cards**.

- Keep `<main id="main-content">`, original `NOSEE` title and the **temporary page-specific noindex** while the full homepage is incomplete.
- Keep the Task 04 six-stage entrance behavior **exactly as approved**, two-slide hero content, 750/850px hero heights, all nav/footer code, newsletter exception and source-specific known quirks unchanged.
- Preserve the source route `/data` in both CTAs, although its destination is not implemented yet. **Do not create a `/data` page, redirect to another route or replace with `#`** simply to avoid a temporary 404. Flag the missing page for the later public-page phase.
- Do not add admin/auth/CMS/database/membership/routes or unrelated package changes.

## 5. Light but real checks and screenshots

After implementing, run **once near the end**: `npm run typecheck`, `npm run lint`, focused native `node --test` tests for the monitoring selection and rendered semantics/hover behavior, `npm run build`, and `git diff --check`. Rerun only failing checks after a fix. Use browser tools already present if available; do not install a new test framework solely for this.

**Reference-to-target visual gate:**
- Reuse the **isolated pinned Laravel renderer** described in Task 03 and Task 04 evidence. It is the source for a like-for-like comparison, not a stand-in for verified current live production.
- Capture the monitoring section in both source and final local Next **production build** at **390×844, 768×1024, 1024×768, 1280×900, 1440×1000**; at minimum 390/768/1440. Same DPR, loaded local fonts, original images, reduced-motion setting where relevant, viewport and scroll alignment. Capture section crops rather than full-page diffs (source still has three later sections).
- Verify actual computed section padding, heading positioning/line wrapping, three card geometry, 16:9 crops, border/padding, title and attribution wrapping, CTA text/position, and transition between stacked and three-equal-column layout at **1024px**.
- Capture a representative **desktop hover or focus-within card lift** in both source and Next (observe 4px lift/shadow); document reduced-motion state and default-motion reveal finding.
- Verify exact accessible external link attributes/target, visible keyboard focus, resource HTTP 200 and image natural dimensions. Ensure no horizontal scroll, runtime errors or unexpected downloads.
- Check hero/nav/footer **regression** at the affected viewport widths. Do not rework them merely to make the monitoring screenshot align.
- Record actual original image hashes, target hashes, screenshots, source/target pixel or geometry differences, test/build output, and any browser-check failures under `docs/evidence/task-05/README.md`. Put linked captures there only if actually produced. **No invented screenshot, parity, Vercel URL or CWV claim.**

**Performance accounting (evidence, not optimization authorization):**
- These three original images total **603,892 bytes**; Task 04 also found **both original hero images (2.77 MB) fetched at initial load**. Measure added encoded/transfer bytes and which images load on cold mobile if feasible. Do not misdescribe source file size as transferred bytes.
- Do **not** add image conversions, `loading="lazy"`, JS lazy rendering, altered `srcset` or other changes to source loading semantics in this strict replica task. Propose an **independent owner-reviewed zero-visible-change performance task** when measurements indicate it is needed.
- No full Lighthouse/throttled audit or Core Web Vitals claims required in Task 05.

## 6. Record progress, push branch, and stop

1. Create `codex/task-05-home-monitoring` from latest `main`; verify that the merged Task 04 PR #4 and `HomeHero` are present.
2. Keep all application changes and verification artifacts on the task branch. Modify only the monitoring section, related minimal data/CSS/tests, `src/app/(public)/page.tsx` and documentation.
3. Update `docs/PROGRESS.md`: record the owner's confirmation that merged Task 04 runs on their **local machine**, which is **functional evidence but not a formal pixel-parity signoff**. Mark Task 04 merged. Task 05 may be `In review` for its increment after verified checks; **P2/PUB-01 remain In progress** until the entire homepage is done and approved. Keep P0 reference gaps, mobile no-JS nav blocker and PERF-01 risk visible.
4. Record branch commit, files, test counts/results, exact source/target screen captures, missing verifications, any source reveal discrepancy and image load/weight evidence in both the evidence README and the progress log.
5. **Commit and push** the new branch. Vercel may create a branch preview; share its actual URL only if verified. The owner can also run `npm ci && npm run dev` locally and inspect the branch. **Do not create PR, merge, or deploy directly to `main`.**
6. Stop for the owner's review. Do not start research/news/events sections or an optimization sprint automatically.

### Acceptance

The existing homepage hero is followed immediately by **three exact Laravel monitoring dashboard cards**, their source data/images/provider links, mobile **ALL DATA** and desktop **SEE ALL DATA** controls, source typography/layout/hover behavior and source-observed motion behavior; targeted tests/build and matched reference/target captures are supplied. The remaining homepage sections, accessiblity blocker and slow-network performance work are still outstanding.

**Next bounded task after owner acceptance:** original homepage Research Outputs section, not a redesign or new catalog feature.
