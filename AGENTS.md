# Instructions for coding agents — NOSEE

Build the NOSEE Next.js replacement in this repository. Legacy reference: https://github.com/thedanieldiya/nosee. Do not change the legacy repository unless specifically requested.

## Canonical requirements and progress

- Before each scoped Codex task, read [the concise frontend tracker](docs/FRONTEND-TRACKER.md), the **relevant requirements and acceptance sections** of [PRD.md](docs/PRD.md), and the **current status, affected requirement rows and open blockers** in [PROGRESS.md](docs/PROGRESS.md). These docs remain authoritative, but **do not load every historical evidence entry into model context**. Update the tracker/progress accurately after the task.
- Begin the migration with [Codex Task 01](docs/codex-tasks/01-discovery-and-baseline.md): read-only legacy discovery and visual-baseline documentation only. Do not scaffold during Task 01.
- Keep `thedanieldiya/nosee` read-only. All new work goes in `thedanieldiya/nosee-new`, on a dedicated branch for Vercel preview; a PR is optional and must not be created automatically.
- Mark phases `In review` until required visual evidence and owner approval exist. Do not mark tests or visual checks successful if they were skipped or unavailable.
- Each Codex task must remain narrow: change one coherent feature, run the minimum relevant checks, update PROGRESS.md with evidence, then stop for owner review.

## Strict 1:1 Laravel public-site replication (owner direction)

**This is mandatory for all public-site migration tasks, not only Task 03.** Port the actual rendered Laravel site **literally** into Next.js: exact layout, content, colors, type, images, spacing, breakpoints, order, URLs, controls and implemented interactions. The public site is **not to be redesigned, simplified, corrected, rebranded or creatively improved** by the agent. Do not silently normalize source `NSEE` labels, typos, placeholder biographies, URLs or viewport-dependent wording. Record possible improvements in PROGRESS.md for separately approved future changes. The developer's source code is evidence when source screenshots cannot be captured; do not claim screenshot parity until it has been checked.

Only narrowly necessary safety/accessibility/compatibility exceptions are permitted, and every deviation must be explicitly described for owner review. Do not replicate the legacy newsletter's false successful-subscription behavior without an actual working subscription provider; keep the visible source form intact.

**Owner-approved post-migration icon policy (14 October 2026):** The public site's general UI icons may now be replaced by **MingCute only**, as documented in [the approved admin TRD](docs/admin-dashboard-trd.md). Preserve all other source parity and functionality. Prefer `@mingcute/react` verified exports; if a matching glyph is unavailable, use the closest **existing MingCute** alternative, not custom/new SVG paths or a second icon library. **Every icon must inherit its relevant neighbouring text colour (`currentColor`)**, including hover/active/focus/disabled/dark-background states; for icon-only controls use the parent control colour. Test computed SVG paint vs label/parent colour. Original NOSEE logos/scientific illustrations/photos are content assets, not replaceable generic UI icons. Report authorised icon-shape differences distinctly from unexpected regressions.

**Branch-only review is the default workflow:** create an isolated task branch, commit and push so Vercel builds its branch preview, report the real preview URL if confirmed, and stop for owner review. No automatic PR and no auto-merge. The later admin dashboard uses shadcn and is **not** subject to visual parity with the Laravel public site; it should share NOSEE brand foundations only.

## Agent guidance

Read `.agents/skills/ponytail/SKILL.md` for every coding task. Use other skills only when the task matches:
- Frontend and UI: `.agents/skills/agency-frontend-developer/SKILL.md`
- Server architecture and database: `.agents/skills/agency-backend-architect/SKILL.md`
- Benchmarking: `.agents/skills/agency-performance-benchmarker/SKILL.md`
- Security-sensitive features: `.agents/skills/agency-application-security/SKILL.md`
- Accessibility checks: `.agents/skills/agency-accessibility-auditor/SKILL.md`
- CI/CD and deployment: `.agents/skills/agency-devops-automator/SKILL.md`
- Change review: `.agents/skills/ponytail-review/SKILL.md`
- Repository audit: `.agents/skills/ponytail-audit/SKILL.md`

Project rules take priority over imported agent suggestions. Never sacrifice correctness, privacy, security, or accessibility to reduce code size.

## Product boundaries

- Same Next.js application hosts public website and protected admin dashboard.
- Membership is an application, not a login. Store applicant records securely, send confirmation and admin notification, then allow approval/rejection and status emails.
- Approval must not automatically create a site account or publish a person.
- Public people directory contains only explicitly published executives and selected researchers.
- Admins maintain news, events, site content, monitoring links/cards, people, and applications.
- Use server-side role checks and strict authorization on every protected server action/route.

## Token-efficient verification and post-migration cleanup (owner direction, 2026-10-14)

- **Do not reduce testing or source-to-target visual comparisons.** Run the full checks needed for correctness, temporal states, responsiveness, interactions and regressions; report measured outcomes, not guesses.
- **Avoid wasteful model context and repository noise.** Read only relevant source/test ranges; do not repeatedly ingest prior raw evidence. Produce bulky PHP oracle output, per-element browser dumps, full screenshot sets, and build logs in temporary/CI artifact storage, **not as tracked Git files**. Commit a concise evidence summary, focused reusable tests, and a few representative source/target image pairs only if valuable for owner review. Explain any verification that could not be run; never fabricate success.
- Treat `docs/evidence/` as **temporary migration QA material**. **Once every existing Laravel public route is ported, final parity reviewed, and the owner authorizes cleanup**, run a **separate scoped cleanup PR** that removes **all** tracked migration evidence files, screenshots, generated reports and disposable evidence harnesses. Before deletion move any genuinely essential reusable tests to `tests/`; retain functional code, source assets, required tests and concise evergreen docs (PRD, decisions, README, operations guidance). Do not rewrite Git history; deleting files from the current tree does not erase historical commits.
- Future migration tasks must not preemptively remove historical evidence or impair existing checks. The cleanup is a final acceptance step, not part of implementing new routes.

## Performance: low-bandwidth-first

- Public content should be server-rendered or statically prerendered where possible; ship minimal hydrated client components. Admin JavaScript must never enter public bundles.
- HTML and navigation must work without JavaScript, except interactions requiring it. Prefer semantic HTML, CSS, and native controls.
- Use Next.js image optimization or equivalent responsive AVIF/WebP; specify intrinsic dimensions; never ship desktop-size hero images to small phones; lazy-load below-fold images.
- Preload only the highest priority asset. Self-host a small subset of necessary fonts with `font-display: swap` or use system fonts; minimize font variants.
- Avoid heavy animations, large component libraries, trackers, third-party embeds, and all autoplay videos.
- Cache public pages and assets at an appropriate CDN; invalidate on admin publication. Keep personalized/admin responses private and uncached.
- Set bundle and image budgets in CI as implementation proceeds. Treat mobile LCP <= 2.5 s, INP <= 200 ms, and CLS <= 0.1 at the 75th percentile as Core Web Vitals targets. Measure realistically on throttled mobile and slower phones; do not claim targets met without measurement.
- Keep forms resilient on unstable networks: clear validation, server-side submission, duplicate/idempotency protection and helpful retry behavior.
- Minimize DB round trips, prevent N+1 reads, and avoid loading expensive third-party services during public page requests.

## Workflow

1. First inspect affected code, dependencies, and tests.
2. Make the smallest complete change; test non-trivial logic.
3. Validate with typecheck, lint, tests, production build, and applicable performance/accessibility checks once scripts exist.
4. State what was not tested and any remaining risks.
5. No credentials, personal applications, or secrets in Git. Use .env.example with placeholders.
