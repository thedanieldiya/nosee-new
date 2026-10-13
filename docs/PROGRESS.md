# NOSEE Next.js delivery progress

**Project:** [NOSEE migration PRD](PRD.md)  
**Updated:** 2026-10-13  
**Status:** P0 discovery delivered for review — documentation only; no Next.js application implemented
**Writable destination:** `thedanieldiya/nosee-new`  
**Read-only legacy source:** `thedanieldiya/nosee`  
**Current task:** [Task 01 — Discovery and baseline](codex-tasks/01-discovery-and-baseline.md) (In review; stop for owner review)

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
| P0 | Audit Laravel source, map migration, establish visual baseline | In review | [Migration map](migration-map.md), [source-derived visual baseline](visual-baseline.md); audit commit `5c6e103292a18b4c5ffcaa9028790ad67c7efb37`. Screenshots missing; owner approach/visual-truth review required before Done/P1 |
| P1 | Scaffold Next.js and port tokens/primitives | Not started | Typecheck/lint/build and token acceptance |
| P2 | Homepage visual/behavior parity | Not started | Desktop/tablet/mobile screenshots and owner review |
| P3 | About/events parity | Not started | Route/behavior checks, screenshots and review |
| P4 | Complete approved public informational pages | Not started | Actual usable routes, links, content approvals |
| P5 | Database, auth and shadcn dashboard foundation | Not started | Authorization, migration, visual theme review |
| P6 | Membership application and email workflow | Not started | Privacy, persistence and email flow evidence |
| P7 | CMS for news/events/people/site/monitoring | Not started | Publish/unpublish and cache invalidation evidence |
| P8 | Release readiness, performance, deployment | Not started | Rollback, functional checks, production approval |

## Requirement progress

| ID | Requirement | Status | Evidence / blockers / owner approval |
| --- | --- | --- | --- |
| CORE-01 | Next.js app structure | Not started | — |
| CORE-02 | Source-extracted public design system | Not started | — |
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
| Codex's access to legacy Laravel code and writable destination | Verified | Work is in `/workspace/nosee-new`, branch `codex/task-01-discovery-baseline`; legacy revision `9872c4ed12aa48835eab71065c69b468424adb4a` inspected and kept read-only by task scope |
| Baseline screenshots of actual public pages | Not captured; access blocked | Live `nosee.org` probe returned HTTP 403/CONNECT denial; local ports 8000/5173 had no server. Browser tooling exists. [Per-page/state matrix and reproduction steps](visual-baseline.md#5-screenshot-evidence-matrix-and-reproduction); no image/visual-parity claims |
| Live versus source design discrepancies | Live comparison unverified; source conflicts documented | Owner chooses live/source/Figma authority and resolves hero autoplay/height, responsive copy and newsletter messaging; see [discrepancies](visual-baseline.md#6-discrepancies-requiring-review) |
| Approved public content vs development placeholder records | Inventory complete; approval pending | Nine event, nine news and ten publication fixtures; About story/John Doe/seven leadership placeholders; starter research/data/product/outreach copy and NSEE/NOSEE differences listed in [migration map](migration-map.md#5-content-approval-and-source-discrepancies) |
| Hosting, data provider, email domain and applicant data policy | Open | Resolve before backend implementation; do not block read-only P0 |
| Task 01 PR creation | GitHub API unavailable | `gh api repos/thedanieldiya/nosee-new --jq .full_name` returned Forbidden from `api.github.com`; use the committed discovery branch for review. No token values requested or printed |

## Task history

| Date | Task / PR | Evidence | Outcome |
| --- | --- | --- | --- |
| 2026-10-13 | PRD and progress tracker initialized | [PRD](PRD.md), [Task 01](codex-tasks/01-discovery-and-baseline.md) | Planning documents only; **no application code shipped** |
| 2026-10-13 | Task 01 — `codex/task-01-discovery-baseline` | [Migration map](migration-map.md), [visual baseline](visual-baseline.md); audit commit `5c6e103292a18b4c5ffcaa9028790ad67c7efb37`; evidence/checks below | P0 **In review**; screenshots and owner acceptance outstanding; P1–P8 and all implementation requirements remain Not started |

## Task 01 evidence — 2026-10-13

- **Source:** `thedanieldiya/nosee` at `9872c4ed12aa48835eab71065c69b468424adb4a`. Destination was fast-forwarded to `62ed14cd4af9fd70ffcb5cdf113ad221bf32798e` to obtain the assigned PRD/task, preserving pre-existing local skill files; a dedicated task branch was then created. Legacy checkout remained unchanged.
- **Deliverables:** source/request-flow and Next.js mapping, five public GET routes plus partial newsletter POST and technical health route, 21 Blade component inventory, 40 content-file translation/approval inventory, exact CSS/fonts/responsive behavior and on-disk asset sizes. All proposed Next.js/backend paths are documentation, not implemented folders or entities.
- **Inspection:** legacy README/PRD/architecture; routes/bootstrap/controllers; providers/contracts/repositories and content/event services/schema/path validation; public layouts/pages/components; navigation/carousel/motion/newsletter JS; content/fixtures; media/font files and existing manifest; relevant PHP/Node test assertions read without execution.
- **Visual evidence:** zero screenshots captured. Every requested 390/768/1440px page/state is explicitly `Not captured` with reproduction steps. The source PRD forbids hero autoplay while JS enables desktop autoplay; source hero height and test expectations differ. Newsletter UI promises delivery that the backend does not provide. Live/source visual differences are not asserted.
- **Checks:** relative Markdown links/anchors and pinned source references checked; source counts/image headers/file sizes read; task diff checked for whitespace after removing new Markdown trailing spaces. No PRD criteria were changed. Legacy Git status checked before/after; no legacy changes. These checks validate documents, not application behavior.
- **Skipped:** application scaffolding/code, dependency installation, tests/build/typecheck/lint, Playwright installation, server startup, Lighthouse, runtime page weights/request counts/CWV, production deployment. There is no destination application to test. Earlier onboarding results are not reported as Task 01 test runs.
- **Remaining gates:** owner review of approach, visual truth/Figma authority, fixture/copy/branding approvals, autoplay/height and newsletter decisions; reachable pinned renderer for actual screenshots. Backend policy/provider choices remain later-phase decisions. GitHub API access prevented automatic PR creation; committed branch/files remain reviewable.
- **One recommended Task 02:** after owner review, bounded P1 foundation only — compatible Next.js App Router/TypeScript/Tailwind scaffold, local brand fonts/tokens, public Container/ButtonLink/ArrowRight primitives, then typecheck/lint/build and token review. No homepage sections, auth, CMS, membership or email work in that task. **Do not begin it automatically.**

## Codex update procedure (mandatory)

After **each scoped task**, make the smallest truthful edit to this file:

1. Record the assigned phase/task status and the exact PR/commit, screenshots, and targeted check results.
2. Change only requirement statuses evidenced by that task; never mark parity Done while the owner has not accepted the comparison.
3. Note anything skipped (including unavailable tools), remaining mismatches, blockers and recommended next chunk.
4. Add one dated entry to Task history. Use the actual date of the change, not the initial date above.
5. Commit the progress change in the **same task/PR branch** as its evidence. Stop; do not silently start the next phase.
