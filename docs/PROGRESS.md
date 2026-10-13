# NOSEE Next.js delivery progress

**Project:** [NOSEE migration PRD](PRD.md)  
**Updated:** 2026-10-13  
**Status:** P1 foundation In review on `codex/task-02-nextjs-foundation`; owner preview approval and P0 reference screenshots remain outstanding.
**Writable destination:** `thedanieldiya/nosee-new`  
**Read-only legacy source:** `thedanieldiya/nosee`  
**Current task:** [Task 03 — strict 1:1 public shell](codex-tasks/03-public-shell.md) (instructions prepared; implementation not started). Task 02 was merged by the owner; P0 screenshots/visual authority remain unverified.

This is the **evidence ledger**, not a replacement for the PRD. Agents must not change an item to Done without the evidence and approvals specified in [PRD section 9](PRD.md#9-delivery-phases-gates-and-evidence). Keep the checklist honest even if this means multiple tasks remain In review.

## Status vocabulary

`Not started` — no implementation/evidence yet.  
`In progress` — scoped task actively being worked.  
`Blocked` — a dependency prevents acceptance.  
`In review` — implementation complete but outstanding verification/approval.  
`Done` — required evidence and any owner approval recorded.

## Phase gates

| Phase | Goal | Status | Evidence / remaining gate |
| --- | --- | --- | --- |
| P0 | Audit Laravel source, map migration, establish visual baseline | In review | [PR #1 merged](https://github.com/thedanieldiya/nosee-new/pull/1); [migration map](migration-map.md) and [source-derived visual baseline](visual-baseline.md) accepted as planning documents. Original-site screenshots and visual truth decisions remain open; no visual-parity claim. P1 foundation authorized to proceed. |
| P1 | Scaffold Next.js and port tokens/primitives | In review | [Task 02 PR #2 merged](https://github.com/thedanieldiya/nosee-new/pull/2); clean install, typecheck, lint, production build and [three-width destination screenshots](evidence/task-02/README.md). Vercel reported a successful main-branch deployment; owner proceeds to Task 03, but reference-source visual parity remains unverified. |
| P2 | Homepage visual/behavior parity | Not started | [Task 03](codex-tasks/03-public-shell.md) prepared as the first public-shell increment. **Strict 1:1 Laravel layout/content/behavior** required. Subsequent hero and homepage section tasks still needed; no reference screenshots yet. |
| P3 | About/events parity | Not started | Route/behavior checks, screenshots and review |
| P4 | Complete approved public informational pages | Not started | Actual usable routes, links, content approvals |
| P5 | Database, auth and shadcn dashboard foundation | Not started | Authorization, migration, visual theme review |
| P6 | Membership application and email workflow | Not started | Privacy, persistence and email flow evidence |
| P7 | CMS for news/events/people/site/monitoring | Not started | Publish/unpublish and cache invalidation evidence |
| P8 | Release readiness, performance, deployment | Not started | Rollback, functional checks, production approval |

## Requirement progress

| ID | Requirement | Status | Evidence / blockers / owner approval |
| --- | --- | --- | --- |
| CORE-01 | Next.js app structure | In progress | Static App Router foundation with public route group builds and serves `/`. Private admin group and full-stack behavior remain later scope. |
| CORE-02 | Source-extracted public design system | In progress | Exact source semantic colors, local heading/body fonts and Container/ButtonLink/ArrowRight ported. Remaining components and owner visual review are outstanding; no pixel-parity claim. |
| CORE-03 | Content and business-rule migration | Not started | — |
| PUB-01 | Homepage parity | Not started | — |
| PUB-02 | About parity | Not started | — |
| PUB-03 | Events parity | Not started | — |
| PUB-04 | Additional approved public pages | Not started | — |
| PUB-05 | Public SEO, routes, redirects and 404 | Not started | — |
| ADM-01 | Protected admin authentication | Not started | — |
| ADM-02 | Branded shadcn admin interface | Not started | — |
| MEM-01 | Public application form | Not started | — |
| MEM-02 | Private admin application review | Not started | — |
| MEM-03 | Application/status email notifications | Not started | — |
| MEM-04 | Member records and curated public profiles | Not started | — |
| CMS-01 | News/events publishing | Not started | — |
| CMS-02 | Site/monitoring resource management | Not started | — |
| CMS-03 | Media and audit safety | Not started | — |
| NWS-01 | Honest functioning newsletter | Not started | — |
| OPS-01 | Security and operating safeguards | Not started | — |
| PERF-01 | Low-bandwidth performance | Not started | — |
| QA-01 | Evidence-based delivery | Not started | — |

## Open blockers and decisions

| Item | Status | Next action |
| --- | --- | --- |
| Codex's access to legacy Laravel code and writable destination | Verified | Task 02 is in `/workspace/nosee-new`, branch `codex/task-02-nextjs-foundation` from main `102331a4386be3f59f6be9bc32af223ba002d989`; legacy revision `9872c4ed12aa48835eab71065c69b468424adb4a` remains unchanged |
| Baseline screenshots of actual public pages | Not captured; access blocked | Live `nosee.org` probe returned HTTP 403/CONNECT denial; local ports 8000/5173 had no server. Browser tooling exists. [Per-page/state matrix and reproduction steps](visual-baseline.md#5-screenshot-evidence-matrix-and-reproduction); no image/visual-parity claims |
| Live versus source design discrepancies | Implemented Laravel source is authoritative for 1:1 migration; screenshots still missing | Owner explicitly prohibited creative or editorial changes. Preserve even source NSEE labels/typos/fixtures and implemented behaviors; document discrepancies without auto-correction. Capture and compare source/reference screenshots as available; see [visual baseline](visual-baseline.md). |
| Approved public content vs development placeholder records | Inventory complete; approval pending | Nine event, nine news and ten publication fixtures; About story/John Doe/seven leadership placeholders; starter research/data/product/outreach copy and NSEE/NOSEE differences listed in [migration map](migration-map.md#5-content-approval-and-source-discrepancies) |
| Vercel preview workflow | Enabled, branch URL per task | Owner reports https://nosee-new.vercel.app as production URL. GitHub verified successful Vercel status for merged Task 02 main commit `1c6e908`; for Task 03, Codex only needs to **push its new branch** and report the actual branch preview URL if available. No PR required. |
| Hosting, data provider, email domain and applicant data policy | Open | Resolve before backend implementation; do not block read-only P0 |
| Task 01 PR creation | Resolved; PR merged | Codex Cloud GitHub API initially returned 403. [PR #1](https://github.com/thedanieldiya/nosee-new/pull/1) was subsequently opened using the connected GitHub account and merged by the owner. Original-site screenshot baseline remains outstanding. |

## Task history

| Date | Task / PR | Evidence | Outcome |
| --- | --- | --- | --- |
| 2026-10-13 | PRD and progress tracker initialized | [PRD](PRD.md), [Task 01](codex-tasks/01-discovery-and-baseline.md) | Planning documents only; **no application code shipped** |
| 2026-10-13 | Task 01 — [`PR #1`](https://github.com/thedanieldiya/nosee-new/pull/1) (`codex/task-01-discovery-baseline`) | [Migration map](migration-map.md), [visual baseline](visual-baseline.md); audit commit `5c6e103292a18b4c5ffcaa9028790ad67c7efb37`; evidence/checks below | Merged by owner; documentary groundwork accepted. P0 **In review** for missing source screenshots/visual decisions; P1–P8 and all implementation requirements remain Not started |
| 2026-10-13 | Task 02 instructions prepared (documentation only) | [Task 02](codex-tasks/02-nextjs-foundation.md); user-reported Vercel domain [nosee-new.vercel.app](https://nosee-new.vercel.app) | At preparation, Task 02 was **Not started**; implementation and review evidence follow below. |
| 2026-10-13 | Task 02 — `codex/task-02-nextjs-foundation` | [Implementation commit `5ebcf5d`](https://github.com/thedanieldiya/nosee-new/commit/5ebcf5d8483283f6715ff8867f2e1d0d7f5a0b53), [screenshots and measured observations](evidence/task-02/README.md); checks below | P1 **In review**, CORE-01/CORE-02 **In progress**. Publication pending at this ledger update; Vercel preview URL/status and owner approval unverified. No homepage/backend work or merge. |
| 2026-10-13 | Task 03 strict 1:1 public shell instructions prepared | [Task 03](codex-tasks/03-public-shell.md), [PRD v1.1](PRD.md), [AGENTS.md](../AGENTS.md) | **Not started.** Owner explicitly requires exact Laravel public appearance/content/interactions. Codex should push a branch only for a Vercel preview; no automatic PR or merge. |

## Task 01 evidence — 2026-10-13

- **Source:** `thedanieldiya/nosee` at `9872c4ed12aa48835eab71065c69b468424adb4a`. Destination was fast-forwarded to `62ed14cd4af9fd70ffcb5cdf113ad221bf32798e` to obtain the assigned PRD/task, preserving pre-existing local skill files; a dedicated task branch was then created. Legacy checkout remained unchanged.
- **Deliverables:** source/request-flow and Next.js mapping, five public GET routes plus partial newsletter POST and technical health route, 21 Blade component inventory, 40 content-file translation/approval inventory, exact CSS/fonts/responsive behavior and on-disk asset sizes. All proposed Next.js/backend paths are documentation, not implemented folders or entities.
- **Inspection:** legacy README/PRD/architecture; routes/bootstrap/controllers; providers/contracts/repositories and content/event services/schema/path validation; public layouts/pages/components; navigation/carousel/motion/newsletter JS; content/fixtures; media/font files and existing manifest; relevant PHP/Node test assertions read without execution.
- **Visual evidence:** zero screenshots captured. Every requested 390/768/1440px page/state is explicitly `Not captured` with reproduction steps. The source PRD forbids hero autoplay while JS enables desktop autoplay; source hero height and test expectations differ. Newsletter UI promises delivery that the backend does not provide. Live/source visual differences are not asserted.
- **Checks:** relative Markdown links/anchors and pinned source references checked; source counts/image headers/file sizes read; task diff checked for whitespace after removing new Markdown trailing spaces. No PRD criteria were changed. Legacy Git status checked before/after; no legacy changes. These checks validate documents, not application behavior.
- **Skipped:** application scaffolding/code, dependency installation, tests/build/typecheck/lint, Playwright installation, server startup, Lighthouse, runtime page weights/request counts/CWV, production deployment. There is no destination application to test. Earlier onboarding results are not reported as Task 01 test runs.
- **Remaining gates:** owner review of approach, visual truth/Figma authority, fixture/copy/branding approvals, autoplay/height and newsletter decisions; reachable pinned renderer for actual screenshots. Backend policy/provider choices remain later-phase decisions. Codex Cloud could not create the PR, but [PR #1](https://github.com/thedanieldiya/nosee-new/pull/1) was opened using the connected GitHub account and merged. Screenshot reference and visual truth decisions remain outstanding.
- **One recommended Task 02:** after owner review, bounded P1 foundation only — compatible Next.js App Router/TypeScript/Tailwind scaffold, local brand fonts/tokens, public Container/ButtonLink/ArrowRight primitives, then typecheck/lint/build and token review. No homepage sections, auth, CMS, membership or email work in that task. **Do not begin it automatically.**

## Task 02 evidence — 2026-10-13

- **Branch and source:** new `codex/task-02-nextjs-foundation` branch from latest fetched main `102331a4386be3f59f6be9bc32af223ba002d989`, containing merged Task 01 documents. Implementation commit: `5ebcf5d8483283f6715ff8867f2e1d0d7f5a0b53`. Legacy files were read at the pinned revision; its Git status remained clean. Pre-existing untracked skill files were preserved and excluded from this task.
- **Delivered:** root-level npm/strict TypeScript/ESLint/Tailwind v4 scaffold, public App Router layout, exact 12 source color tokens and two font-family tokens, local Latin font faces, and only Container/ButtonLink/ArrowRight. Exact source SVG copied and byte-compared. Container retains 90rem maximum width and original breakpoint gutters; links retain source dimensions, nine styles and disabled semantics. `/` is a clearly temporary server-rendered specimen with page-specific `noindex, nofollow`, a matching skip link and valid in-page anchors. No custom client components or remote font download.
- **Runtime policy:** validated locally with Node **24.19.0** and npm **11.9.0**; engine and `.node-version` select **24.x**. Published stable Next/React peer requirements were checked. Published `@vercel/build-utils` 14.20.1 lists the `nodejs24.x` runtime (package integrity checked before inspection; not installed into the app). Actual Vercel execution remains unverified. ESLint 9 is registry-deprecated but retained for current Next plugin peer compatibility; no peer verification bypass.

### Installed direct packages

| Purpose | Exact installed versions |
| --- | --- |
| Runtime | `next` 16.4.0; `react` and `react-dom` 19.3.0 |
| Self-hosted fonts | `@fontsource/ubuntu-sans` and `@fontsource/ibm-plex-sans` 5.2.8 |
| CSS tooling | `tailwindcss` and `@tailwindcss/postcss` 4.3.3; `postcss` 8.5.16 |
| Type tooling | `typescript` 5.9.3; `@types/node` 24.19.2; `@types/react` and `@types/react-dom` 19.3.0 |
| Lint tooling | `eslint` 9.39.5; `eslint-config-next` 16.4.0 |

### Checks and remaining gates

- **Required checks:** `npm ci --no-fund --no-audit`, `npm run typecheck`, `npm run lint`, one `npm run build`, and `git diff --check` passed. The first lint run reported one anonymous-default-export warning in PostCSS config; a named config export corrected it and the targeted lint rerun passed without warnings. The required clean install used a writable cloud npm cache. Next's production build prerendered `/` and `/_not-found`.
- **Runtime/browser checks:** local production `/` returned HTTP 200 with meaningful HTML/main/metadata. Existing Chromium/Playwright checked 390×844, 768×1024 and 1440×1000: 16/24/64px gutters, source fonts/colors, 36/44/48px controls, 2px radius, nine variants, disabled-link semantics, decorative masked arrow, keyboard skip/accent focus, valid anchors and no horizontal overflow. All observed requests were same-origin HTTP 200. Reading and native anchor navigation also passed with JavaScript disabled. [Actual browser observations](evidence/task-02/browser-checks.json); [six captured specimen/focus screenshots](evidence/task-02/README.md). These are destination specimens, not legacy comparisons or a WCAG certification.
- **Low-bandwidth observations:** local production subresources totaled 134,971 encoded bytes of framework JavaScript (~132KiB), 4,205 CSS bytes, 105,240 font bytes across five demonstrated Latin faces (~103KiB), and the 217-byte SVG. Thirteen observed requests including HTML; no third-party requests or font preloads. JavaScript/fonts exceed the provisional P0 proposals; revisit actual page font needs and framework transfer during P2. **PERF-01 is not achieved**; no throttled lab, Lighthouse, field data or Core Web Vitals measurement was run.
- **Preview and publication:** branch publication/PR creation pending at this ledger update. GitHub API and Vercel access returned HTTP 403 from Codex Cloud. Owner instructed: “just put your work in a new branch, vercel will pick it from there.” Existing Git integration is the deployment path; no Vercel settings/secrets changed. Actual branch-specific preview URL and remote build status are **unverified**; the production domain is not presented as this preview.
- **Skipped/excluded:** full homepage, public header/footer, About/events/content migration, backend/admin/auth/database/membership/newsletter, broad E2E suite, new browser dependencies and full performance benchmarking. Original Laravel screenshots and visual truth/content decisions remain outstanding. No requirement or phase is marked Done; no merge.
- **One recommended next task:** after owner acceptance, Task 03 — bounded real public shell (source navigation/footer and responsive/keyboard behavior) before homepage section migration. Stop here; do not begin it automatically.

## Codex update procedure (mandatory)

After **each scoped task**, make the smallest truthful edit to this file:

1. Record the assigned phase/task status and the exact PR/commit, screenshots, and targeted check results.
2. Change only requirement statuses evidenced by that task; never mark parity Done while the owner has not accepted the comparison.
3. Note anything skipped (including unavailable tools), remaining mismatches, blockers and recommended next chunk.
4. Add one dated entry to Task history. Use the actual date of the change, not the initial date above.
5. Commit the progress change in the **same task/PR branch** as its evidence. Stop; do not silently start the next phase.
