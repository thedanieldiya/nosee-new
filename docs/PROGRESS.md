# NOSEE Next.js delivery progress

**Project:** [NOSEE migration PRD](PRD.md)  
**Updated:** 2026-10-13  
**Status:** Not started — project instructions and planning PRD exist, but the Next.js application has not been implemented  
**Writable destination:** `thedanieldiya/nosee-new`  
**Read-only legacy source:** `thedanieldiya/nosee`  
**Current task:** [Task 01 — Discovery and baseline](codex-tasks/01-discovery-and-baseline.md) (Not started)

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
| P0 | Audit Laravel source, map migration, establish visual baseline | Not started | Run Task 01; review `migration-map.md` and `visual-baseline.md` |
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
| Codex's access to legacy Laravel code and writable destination | Not verified | In Task 01, identify which repo is mounted and verify old source is read-only |
| Baseline screenshots of actual public pages | Not collected | Task 01: capture where browser tooling allows, else record missing views |
| Live versus source design discrepancies | Not audited | Task 01: identify and document |
| Approved public content vs development placeholder records | Not audited | Task 01: list fixtures and flag for owner review |
| Hosting, data provider, email domain and applicant data policy | Open | Resolve before backend implementation; do not block read-only P0 |

## Task history

| Date | Task / PR | Evidence | Outcome |
| --- | --- | --- | --- |
| 2026-10-13 | PRD and progress tracker initialized | [PRD](PRD.md), [Task 01](codex-tasks/01-discovery-and-baseline.md) | Planning documents only; **no application code shipped** |

## Codex update procedure (mandatory)

After **each scoped task**, make the smallest truthful edit to this file:

1. Record the assigned phase/task status and the exact PR/commit, screenshots, and targeted check results.
2. Change only requirement statuses evidenced by that task; never mark parity Done while the owner has not accepted the comparison.
3. Note anything skipped (including unavailable tools), remaining mismatches, blockers and recommended next chunk.
4. Add one dated entry to Task history. Use the actual date of the change, not the initial date above.
5. Commit the progress change in the **same task/PR branch** as its evidence. Stop; do not silently start the next phase.
