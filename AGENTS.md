# Instructions for coding agents — NOSEE

Build the NOSEE Next.js replacement in this repository. Legacy reference: https://github.com/thedanieldiya/nosee. Do not change the legacy repository unless specifically requested.

## Canonical requirements and progress

- Before each scoped Codex task, read [the concise frontend tracker](docs/FRONTEND-TRACKER.md), the **relevant requirements and acceptance sections** of [PRD.md](docs/PRD.md), and the **current status, affected requirement rows and open blockers** in [PROGRESS.md](docs/PROGRESS.md). These docs remain authoritative, but **do not load every historical evidence entry into model context**. Update the tracker/progress accurately after the task.
- The original Laravel public migration is complete as a development milestone. Consult [public-site status](docs/PUBLIC-SITE-STATUS.md), [source map](docs/migration-map.md) and [design reference](docs/visual-baseline.md) before changing public code. Release gates remain separate; completed migration briefs have been retired.
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
- Approved admin scope (canonical [TRD v1.2](docs/admin-dashboard-trd.md)): manage membership, research groups, News/Events/DOI-first Publications, Homepage Hero, independently published Leadership profiles, standalone caption-required Gallery photos and caption-optional Albums, Privacy policy and administrator accounts. Homepage News/Events/Research Outputs are selected automatically from published records. **Do not** add About/Contact/Shared content editors or Monitoring dashboard CRUD: public displays remain code-managed, with a reserved empty admin Monitoring page.
- Use server-side role checks and strict authorization on every protected server action/route.

## Verification and repository hygiene (owner direction, 14 October 2026)

- Keep all checks needed for correctness, temporal states, responsiveness, interactions and regressions. Future public visual changes require actual source/target comparison; report measured outcomes and unavailable checks honestly.
- Keep bulky PHP exports, browser dumps, screenshots and build logs in temporary or CI storage, outside the checkout. Retain concise decisions/results in evergreen docs and genuinely reusable tests/compact independent runtime fixtures under `tests/`; do not regenerate a migration-artifact archive.
- The owner expressly authorised Task 12 to combine final technical sanity checks, a deferred-release register, and deletion of all temporary migration artifacts/completed briefs from the current tree. Preserve functional code/assets, reusable tests/fixtures, package lock, PRD, Admin TRD and future admin instructions. No Git history rewrite.
- Original frontend development is complete; manual AT/live deployment/content/rights/indexing/public launch are not certified. Preserve the [approved exceptions and release checklist](docs/PUBLIC-SITE-STATUS.md). Mobile Lighthouse **~3.54s is accepted for development**; ≤2.5s remains deferred. No further performance optimisation in Task 12.
- After owner review and merge of Task 12, the next separate task is [Admin Foundation](docs/admin/01-foundation.md), governed by [Admin TRD v1.1](docs/admin-dashboard-trd.md). Deferred release gates do not alone block separately authorised admin development. No admin code in the cleanup branch, no automatic PR/merge or production settings changes.

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
