# NOSEE — Next.js rebuild

Project repository for the Network of Space–Earth Environmentalists (NOSEE) website.

This repository is separate from the [existing Laravel implementation](https://github.com/thedanieldiya/nosee), which remains untouched.

## Intended application

- Public, accessible, low-bandwidth website for NOSEE's research, news, events, publications, and monitoring resources.
- Admin-only dashboard to publish content, manage leadership and featured researchers, and review membership applications.
- Public membership application form **without applicant login**. Applicants receive submission confirmations; admins are notified and can approve/reject applicants with email notifications.
- Member records are private by default. Only deliberately published executive/researcher profiles appear on the public website.

**Status:** Tasks 02–05 have been merged. The owner previously verified that the Next.js homepage renders locally; Task 05 monitoring comparisons report eight pixel-identical paired crops. The homepage currently has the hero and monitoring dashboard; [Task 06](docs/codex-tasks/06-complete-homepage.md) is prepared to add the remaining Research Outputs, Trending News and Upcoming Events sections as one quality-gated increment. Admin/backend features remain future phases. See [PROGRESS.md](docs/PROGRESS.md) and [Task 05 comparisons](docs/evidence/task-05/README.md).

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
npm run build
npm run start
```

Typecheck generates Next's route types before running strict TypeScript. Lint uses the ESLint CLI with Next's flat configuration. Tailwind CSS 4.3.3 uses `@tailwindcss/postcss`; no static-export setting or custom server is needed. On hosts with an unwritable npm cache, use `npm --cache /workspace/.cache/npm ci` or another writable cache location.

ESLint 9.39.5 is pinned because the current Next React/import/accessibility plugin peer ranges do not yet accept ESLint 10. The registry marks ESLint 9 deprecated; upgrade the lint stack together when those peers support the current major. No peer checks are bypassed.

## Foundation scope

- `src/styles/tokens.css` is the single source for the legacy semantic palette and font-family tokens; `src/app/globals.css` imports those tokens and establishes base/focus styles. Tailwind's 640/768/1024/1280px breakpoints are unchanged.
- `src/components/site/ui/Container.tsx`, `ButtonLink.tsx`, and `ArrowRight.tsx` are server components. The container preserves the 90rem width and source gutters; links preserve 36/44/48px sizes, fill/stroke/text styles, and disabled semantics. Native footer buttons share the same source classes. Copied media comprises the source arrow, white logo, five social SVGs, two hero images and three monitoring PNGs, all unmodified.
- Fonts are self-hosted from the same `@fontsource` 5.2.8 families as the legacy project, with Latin subsets and `font-display: swap`. Local faces include Ubuntu Sans 500/600/700 and IBM Plex Sans 400/500/600 plus 400 italic. No font is preloaded or fetched from Google at build time.
- `/` has the source title **NOSEE**, server-rendered hero and monitoring section, then the shared footer temporarily. Its page metadata remains `noindex, nofollow` until the complete homepage passes review; the root layout does not impose a site-wide indexing policy. The foundation specimen has been removed.
- Navigation/footer/hero markup and literal `src/lib/content/` records are server-rendered. Small client controllers handle scroll/drawer behavior, the task-approved newsletter error response and homepage-only carousel/entrance. The owner approved enabling the declared six-stage entrance because the pinned Laravel renderer plays no entrance animation. Native Web Animations adds no dependency. No admin, database, auth, email or membership implementation is included. Next.js still supplies its framework runtime.
- Monitoring uses two server components and the exact source CSS for desktop hover/focus lift. Literal data preserves sorted source order and strict homepage selection, excluding the starter dataset. Its reveal hooks remain, but no reveal is activated because the pinned renderer plays none; the hero approval does not authorize changing this. The three 600×338 eager PNGs total 603,892 bytes. These are static source screenshots and links, not live data feeds.

The public layout keeps the source offset variables isolated from future admin routes. The hero starts at the top underneath the overlaid source header, without specimen padding. Internal-page migration should apply the source `pt-[var(--expanded-navbar-offset)]` rule to its main content. The shell geometry is unchanged. Unimplemented source destinations, including both hero CTA paths and `/login`, are retained and currently lead to 404 pages.

The newsletter keeps its source text/form/closed dialog, but a valid JavaScript-enabled submission shows the existing error without transmitting email or opening the false-success dialog. Its native no-JS POST remains unimplemented. The source no-JS navigation fallback is broken by CSS layer precedence; its rules and the source close-icon behavior are retained under the owner's no-corrections instruction. [Task 03 reference/target captures and exceptions](docs/evidence/task-03/README.md) describe the checks, blocked accessibility gate and proposed correction requiring approval.

**Public-site fidelity:** All public pages are a strict 1:1 migration of the original Laravel site's visible layout, content, assets and behavior. No editorial or design corrections without owner approval; see [PRD](docs/PRD.md) and [Task 03](docs/codex-tasks/03-public-shell.md). The admin dashboard is a later, separate project phase.

## Preview deployment

The owner connected this repository to Vercel. Push the task branch to trigger that integration and review its **actual branch deployment URL** from Vercel/GitHub checks. `https://nosee-new.vercel.app` is the main/production domain and must not be presented as the task preview. Deployment status and any available preview URL are recorded in [PROGRESS.md](docs/PROGRESS.md); stop after pushing the task branch for owner review.

## Delivery documents

- [Migration and admin PRD](docs/PRD.md) — product requirements, route scope, acceptance conditions, design parity, backend/security and performance targets.
- [Codex progress tracker](docs/PROGRESS.md) — live milestone and requirement statuses with evidence and blockers.
- [Codex Task 01](docs/codex-tasks/01-discovery-and-baseline.md) — first task: audit the legacy source and produce a visual/migration baseline **without changing application code**.
- [Codex Task 02](docs/codex-tasks/02-nextjs-foundation.md) — scaffold a lean Next.js application, port source fonts/tokens and first primitives, and review via a Vercel branch preview.
- [Codex Task 03](docs/codex-tasks/03-public-shell.md) — strictly reproduce the original Laravel public navigation, footer, and responsive behavior; push a branch for Vercel preview without requiring a PR.
- [Codex Task 04](docs/codex-tasks/04-homepage-hero.md) — reproduce the two original homepage hero slides, images, overlays, carousel/autoplay/swipe, and entrance animations with pinned-source visual comparisons.
- [Codex Task 05](docs/codex-tasks/05-home-monitoring.md) — reproduce the three source monitoring dashboard cards, exact images/data and responsive CTAs, with matched Laravel/Next screenshots and no creative changes.
- [Codex Task 06](docs/codex-tasks/06-complete-homepage.md) — migrate the remaining three homepage sections together, with independent source data, responsive visual, behavior and full-page regression evidence. Faster delivery does not relax the 1:1 quality gate.

## Performance is a product requirement

The public website must remain useful on slow mobile connections and lower-powered devices. Prefer server-rendered/prerendered content, small HTML/CSS, little or no client JavaScript on information pages, properly sized images, no unnecessary third-party scripts, and no dependence on JavaScript for primary reading/navigation. Set measurable bundle, image, and Core Web Vitals budgets during the first implementation milestone; validate with throttled mobile tests and real-user data where available.

See [AGENTS.md](AGENTS.md) for the detailed engineering rules and [the project-local skills](.agents/skills/) for coding-agent guidance. Files in `.agents/` are **developer tooling, not runtime dependencies**.

## Third-party development guidance

- [Ponytail](https://github.com/DietrichGebert/ponytail) — lean implementation and review skills.
- [Agency Agents](https://github.com/msitarzewski/agency-agents) — selected engineering, security, accessibility, and performance specialist profiles.

The source licenses and attribution are retained in [third-party notices](.agents/THIRD_PARTY_NOTICES.md).
