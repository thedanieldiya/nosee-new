# NOSEE — Next.js rebuild

Project repository for the Network of Space–Earth Environmentalists (NOSEE) website.

This repository is separate from the [existing Laravel implementation](https://github.com/thedanieldiya/nosee), which remains untouched.

## Intended application

- Public, accessible, low-bandwidth website for NOSEE's research, news, events, publications, and monitoring resources.
- Admin-only dashboard to publish content, manage leadership and featured researchers, and review membership applications.
- Public membership application form **without applicant login**. Applicants receive submission confirmations; admins are notified and can approve/reject applicants with email notifications.
- Member records are private by default. Only deliberately published executive/researcher profiles appear on the public website.

**Status:** Task 02 provides the Next.js foundation and a temporary, non-indexed component specimen. The public website and backend features have not been migrated. See [PROGRESS.md](docs/PROGRESS.md) for checks and review gates.

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
npm run build
npm run start
```

Typecheck generates Next's route types before running strict TypeScript. Lint uses the ESLint CLI with Next's flat configuration. Tailwind CSS 4.3.3 uses `@tailwindcss/postcss`; no static-export setting or custom server is needed. On hosts with an unwritable npm cache, use `npm --cache /workspace/.cache/npm ci` or another writable cache location.

ESLint 9.39.5 is pinned because the current Next React/import/accessibility plugin peer ranges do not yet accept ESLint 10. The registry marks ESLint 9 deprecated; upgrade the lint stack together when those peers support the current major. No peer checks are bypassed.

## Foundation scope

- `src/styles/tokens.css` is the single source for the legacy semantic palette and font-family tokens; `src/app/globals.css` imports those tokens and establishes base/focus styles. Tailwind's 640/768/1024/1280px breakpoints are unchanged.
- `src/components/site/ui/Container.tsx`, `ButtonLink.tsx`, and `ArrowRight.tsx` are server components. The container preserves the 90rem width and source gutters; links preserve 36/44/48px sizes, fill/stroke/text styles, and disabled semantics. The exact source SVG is the only copied media asset.
- Fonts are self-hosted from the same `@fontsource` 5.2.8 families as the legacy project, with Latin subsets and `font-display: swap`. This specimen needs Ubuntu Sans 500/600 and IBM Plex Sans 400/500 plus 400 italic; import other legacy weights when a later page actually needs them. No font is preloaded or fetched from Google at build time.
- `/` is **NOSEE — Foundation Preview**, a temporary server-rendered review aid using in-page links. Its page metadata is `noindex, nofollow`; the root layout does not impose a site-wide indexing policy. Replace the specimen during reviewed P2 work.
- No custom client JavaScript, navigation/footer, homepage sections, admin, database, auth, email or membership implementation is included. Next.js still supplies its framework runtime; server components do not imply a zero-byte framework bundle.

**Public-site fidelity:** All public pages are a strict 1:1 migration of the original Laravel site's visible layout, content, assets and behavior. No editorial or design corrections without owner approval; see [PRD](docs/PRD.md) and [Task 03](docs/codex-tasks/03-public-shell.md). The admin dashboard is a later, separate project phase.

## Preview deployment

The owner connected this repository to Vercel. Push the task branch to trigger that integration and review its **actual branch deployment URL** from Vercel/GitHub checks. `https://nosee-new.vercel.app` is the main/production domain and must not be presented as the task preview. Deployment status and any available preview URL are recorded in [PROGRESS.md](docs/PROGRESS.md); do not merge the foundation until the owner reviews it.

## Delivery documents

- [Migration and admin PRD](docs/PRD.md) — product requirements, route scope, acceptance conditions, design parity, backend/security and performance targets.
- [Codex progress tracker](docs/PROGRESS.md) — live milestone and requirement statuses with evidence and blockers.
- [Codex Task 01](docs/codex-tasks/01-discovery-and-baseline.md) — first task: audit the legacy source and produce a visual/migration baseline **without changing application code**.
- [Codex Task 02](docs/codex-tasks/02-nextjs-foundation.md) — scaffold a lean Next.js application, port source fonts/tokens and first primitives, and review via a Vercel branch preview.
- [Codex Task 03](docs/codex-tasks/03-public-shell.md) — strictly reproduce the original Laravel public navigation, footer, and responsive behavior; push a branch for Vercel preview without requiring a PR.

## Performance is a product requirement

The public website must remain useful on slow mobile connections and lower-powered devices. Prefer server-rendered/prerendered content, small HTML/CSS, little or no client JavaScript on information pages, properly sized images, no unnecessary third-party scripts, and no dependence on JavaScript for primary reading/navigation. Set measurable bundle, image, and Core Web Vitals budgets during the first implementation milestone; validate with throttled mobile tests and real-user data where available.

See [AGENTS.md](AGENTS.md) for the detailed engineering rules and [the project-local skills](.agents/skills/) for coding-agent guidance. Files in `.agents/` are **developer tooling, not runtime dependencies**.

## Third-party development guidance

- [Ponytail](https://github.com/DietrichGebert/ponytail) — lean implementation and review skills.
- [Agency Agents](https://github.com/msitarzewski/agency-agents) — selected engineering, security, accessibility, and performance specialist profiles.

The source licenses and attribution are retained in [third-party notices](.agents/THIRD_PARTY_NOTICES.md).
