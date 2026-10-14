# NOSEE — Next.js rebuild

Project repository for the Network of Space–Earth Environmentalists (NOSEE) website.

This repository is separate from the [existing Laravel implementation](https://github.com/thedanieldiya/nosee), which remains untouched.

## Intended application

- Public, accessible, low-bandwidth website for NOSEE's research, news, events, publications, and monitoring resources.
- Admin-only dashboard to publish content, manage leadership and featured researchers, and review membership applications.
- Public membership application form **without applicant login**. Applicants receive submission confirmations; admins are notified and can approve/reject applicants with email notifications.
- Member records are private by default. Only deliberately published executive/researcher profiles appear on the public website.

**Status:** [Tasks 01–09 merged](docs/FRONTEND-TRACKER.md): all original Laravel public routes have been ported, including [Task 09 PR #9](https://github.com/thedanieldiya/nosee-new/pull/9) for event details, meeting 302 and 404. [Task 10](docs/codex-tasks/10-final-frontend-icons-review.md) is **instructions ready, implementation not started**: owner-approved MingCute-only public UI icon migration with exact adjacent-text colour inheritance, plus comprehensive responsive/performance/a11y final review. Task 09 reports 97 tests and 52 zero-RGB pairs; uppercase invalid slug source 500 → Next 404 remains documented. Formal owner/fixture/indexing/low-bandwidth/production review remains. **Only after final acceptance**, a separate owner-approved PR deletes all temporary migration evidence. See [PROGRESS.md](docs/PROGRESS.md).

## Development

Use **Node.js 24.x** and npm. `.node-version` and `package.json` select the same major as the cloud environment (validated with Node 24.19.0); Vercel should use the package engine policy. Next.js 16.4.0 requires Node >=20.9.0, and React/React DOM 19.3.0 satisfy its published stable peer ranges. TypeScript is pinned to 5.9.3. Exact dependency versions are committed in `package-lock.json`.

```bash
npm ci
npm run dev
```

For validation and a local production server:

```bash
npm run typecheck
npm run lint
node --test tests/navigation.test.mjs
node --test tests/hero-carousel.test.mjs tests/hero-entrance.test.mjs
node --test tests/monitoring.test.mjs
node --test tests/homepage-content.test.mjs tests/homepage-sections.test.mjs
node --test tests/about-page.test.mjs tests/profile-carousel.test.mjs
node --test tests/events-listing.test.mjs tests/events-pages.test.mjs tests/event-details.test.mjs
npm run build
npm run start
```

Typecheck generates Next's route types before running strict TypeScript. Lint uses the ESLint CLI with Next's flat configuration. Tailwind CSS 4.3.3 uses `@tailwindcss/postcss`; no static-export setting or custom server is needed. On hosts with an unwritable npm cache, use `npm --cache /workspace/.cache/npm ci` or another writable cache location.

ESLint 9.39.5 is pinned because the current Next React/import/accessibility plugin peer ranges do not yet accept ESLint 10. The registry marks ESLint 9 deprecated; upgrade the lint stack together when those peers support the current major. No peer checks are bypassed.

## Foundation scope

- `src/styles/tokens.css` is the single source for the legacy semantic palette and font-family tokens; `src/app/globals.css` imports those tokens and establishes base/focus styles. Tailwind's 640/768/1024/1280px breakpoints are unchanged.
- `src/components/site/ui/Container.tsx`, `ButtonLink.tsx`, and `ArrowRight.tsx` are server components. The container preserves the 90rem width and source gutters; links preserve 36/44/48px sizes, fill/stroke/text styles, and disabled semantics. Native footer/carousel buttons share source classes; optional icon-only sizes and arrow rotation preserve existing defaults. Copied media comprises the source arrow, white logo, five social SVGs, two hero images, three monitoring PNGs, three news PNGs, six About PNGs, five additional original Events SVGs and empty original favicon, all unmodified.
- Fonts are self-hosted from the same `@fontsource` 5.2.8 families as the legacy project, with Latin subsets and `font-display: swap`. Local faces include Ubuntu Sans 500/600/700 and IBM Plex Sans 400/500/600 plus 400 italic. No font is preloaded or fetched from Google at build time.
- `/` has the source title **NOSEE** and all five server-rendered sections. It renders per request so UTC event selection cannot freeze at build time. Its page metadata remains `noindex, nofollow` pending owner review and approval of development fixtures; the root layout does not impose a site-wide indexing policy.
- Navigation/footer/hero markup and literal `src/lib/content/` records are server-rendered. Small pathname link/submenu boundaries supply correct active state in SSR and client navigation; controllers handle scroll/drawer, the task-approved newsletter error response and homepage-only carousel/entrance. The owner approved enabling the declared six-stage homepage entrance because the pinned Laravel renderer plays no entrance animation. Native Web Animations adds no dependency. No admin, database, auth, email or membership implementation is included. Next.js still supplies its framework runtime.
- Monitoring uses two server components and the exact source CSS for desktop hover/focus lift. Literal data preserves sorted source order and strict homepage selection, excluding the starter dataset. Its reveal hooks remain, but no reveal is activated because the pinned renderer plays none; the hero approval does not authorize changing this. The three 600×338 eager PNGs total 603,892 bytes. These are static source screenshots and links, not live data feeds.
- Research/news/events use three server sections and three source card types, with literal records and source-equivalent selectors. Research sorts featured publications newest-first; news ranks strict featured first then raw ISO strings; events select featured records through their end day in **UTC**, sorted by start/slug. Original dates, DOI fixtures, duplicate news image, responsive CTAs and source URLs remain. No new section reveals are activated. Three eager news PNGs add 547,673 bytes; all initial image bodies total about 3.94MB locally. Performance targets remain unachieved.

- `/about` is statically server-rendered with all six editorial regions, exact conditional copy/pictures, three objectives, John Doe quote, story and seven original profile placeholders. Its small carousel controller preserves 1/2/3 profiles, grouped indicators, one-step arrows, mobile swipe and source resize behavior with cleanup. No new reveal or dependency. About remains `noindex, nofollow` pending content approval. [Evidence](docs/evidence/task-07/README.md) records the retained initial gutter offset, native 1px fragment variance and no-JS limitations.

- `/events` and `/events/archive` render per request with the original server-local event-timezone state machine, desktop native GET search, featured/ongoing/upcoming selection and newest-first archive. Four server event components reuse original cards, SVGs and palettes; homepage's separate UTC selection remains unchanged. Both pages keep fixture noindex/nofollow. [Task 08 evidence](docs/evidence/task-08/README.md) documents retained source button visibility/clipping quirks. No Events client controller or new dependency.

- Eight regular `/events/[slug]` pages render per request with exact source detail sections, escaped body and optional itinerary/register/resources/people. Existing records and presentation services are reused, including closed past deadlines; titles and fixture noindex remain. `/events/icelli2026` returns native HTTP **302** with the exact original external URL. Missing slugs/public URLs use a shared 404 inside the public shell, including SSR with JavaScript off. Next's experimental global not-found boundary and a narrow Proxy provide complete 404 HTML and encoded meeting handling; trailing slashes render directly as in Laravel. [Task 09 evidence](docs/evidence/task-09/README.md) records the uppercase-invalid source 500 versus required target 404 exception.

The public layout keeps source offset variables isolated from future admin routes. The hero starts underneath the overlaid header. About, Events detail/listing/archive and 404 apply `pt-[var(--expanded-navbar-offset)]` through a route wrapper; homepage/shell geometry is unchanged. Unimplemented source destinations, including collaboration actions, the old AGM hero slug and `/login`, retain their original URLs and return 404. The ICELLI hero CTA now uses the exact meeting 302.

The newsletter keeps its source text/form/closed dialog, but a valid JavaScript-enabled submission shows the existing error without transmitting email or opening the false-success dialog. Its native no-JS POST remains unimplemented. The source no-JS navigation fallback is broken by CSS layer precedence; its rules and the source close-icon behavior are retained under the owner's no-corrections instruction. [Task 03 reference/target captures and exceptions](docs/evidence/task-03/README.md) describe the checks, blocked accessibility gate and proposed correction requiring approval.

**Public-site fidelity:** All public pages are a strict 1:1 migration of the original Laravel site's visible layout, content, assets and behavior. No editorial or design corrections without owner approval; see [PRD](docs/PRD.md) and [Task 03](docs/codex-tasks/03-public-shell.md). The admin dashboard is a later, separate project phase.

## Preview deployment

The owner connected this repository to Vercel. Push the task branch to trigger that integration and review its **actual branch deployment URL** from Vercel/GitHub checks. `https://nosee-new.vercel.app` is the main/production domain and must not be presented as the task preview. Deployment status and any available preview URL are recorded in [PROGRESS.md](docs/PROGRESS.md); stop after pushing the task branch for owner review.

## Delivery documents

- [Migration and admin PRD](docs/PRD.md) — product requirements, route scope, acceptance conditions, design parity, backend/security and performance targets.
- [Concise frontend task tracker](docs/FRONTEND-TRACKER.md) — ten-task existing-source roadmap, nine merged, Task 10 ready and final evidence cleanup gate.
- [Codex progress tracker](docs/PROGRESS.md) — live milestone and requirement statuses with evidence and blockers.
- [Codex Task 01](docs/codex-tasks/01-discovery-and-baseline.md) — first task: audit the legacy source and produce a visual/migration baseline **without changing application code**.
- [Codex Task 02](docs/codex-tasks/02-nextjs-foundation.md) — scaffold a lean Next.js application, port source fonts/tokens and first primitives, and review via a Vercel branch preview.
- [Codex Task 03](docs/codex-tasks/03-public-shell.md) — strictly reproduce the original Laravel public navigation, footer, and responsive behavior; push a branch for Vercel preview without requiring a PR.
- [Codex Task 04](docs/codex-tasks/04-homepage-hero.md) — reproduce the two original homepage hero slides, images, overlays, carousel/autoplay/swipe, and entrance animations with pinned-source visual comparisons.
- [Codex Task 05](docs/codex-tasks/05-home-monitoring.md) — reproduce the three source monitoring dashboard cards, exact images/data and responsive CTAs, with matched Laravel/Next screenshots and no creative changes.
- [Codex Task 06](docs/codex-tasks/06-complete-homepage.md) — migrate the remaining three homepage sections together, with independent source data, responsive visual, behavior and full-page regression evidence. Faster delivery does not relax the 1:1 quality gate.
- [Codex Task 07](docs/codex-tasks/07-about-page.md) — recreate the complete About page, all viewport-specific images/copy and seven-person leadership carousel in one branch, with independent Laravel/Next section and interaction comparisons.
- [Codex Task 08](docs/codex-tasks/08-events-listing-archive.md) — migrate exact Laravel Events listing, desktop GET search, featured/ongoing/upcoming states and archive in one branch, with per-event timezone/clock tests and independent source-target screenshots.
- [Codex Task 09](docs/codex-tasks/09-event-details-and-404.md) — finish original event detail pages, exact meeting 302 redirects and shared 404; run full QA but keep committed evidence compact.
- [Codex Task 10](docs/codex-tasks/10-final-frontend-icons-review.md) — standardize existing public UI icons to MingCute with colours inherited exactly from neighbouring text, then execute full existing-Laravel frontend regression/performance/accessibility review.

## Performance is a product requirement

The public website must remain useful on slow mobile connections and lower-powered devices. Prefer server-rendered/prerendered content, small HTML/CSS, little or no client JavaScript on information pages, properly sized images, no unnecessary third-party scripts, and no dependence on JavaScript for primary reading/navigation. Set measurable bundle, image, and Core Web Vitals budgets during the first implementation milestone; validate with throttled mobile tests and real-user data where available.

See [AGENTS.md](AGENTS.md) for the detailed engineering rules and [the project-local skills](.agents/skills/) for coding-agent guidance. Files in `.agents/` are **developer tooling, not runtime dependencies**.

## Third-party development guidance

- [Ponytail](https://github.com/DietrichGebert/ponytail) — lean implementation and review skills.
- [Agency Agents](https://github.com/msitarzewski/agency-agents) — selected engineering, security, accessibility, and performance specialist profiles.

The source licenses and attribution are retained in [third-party notices](.agents/THIRD_PARTY_NOTICES.md).
