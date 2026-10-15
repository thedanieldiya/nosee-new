# NOSEE delivery progress

**Updated:** 15 October 2026. **Public frontend migration and Task 12 cleanup merged as [PR #12](https://github.com/thedanieldiya/nosee-new/pull/12)** (main `c8d717d7`). All `docs/evidence/` files and completed migration briefs are removed. **Public launch remains unapproved** pending the separately documented manual accessibility, live deployment, content and indexing gates. Mobile Lighthouse LCP ~3.54s remains accepted for current development.

**Current priority:** [Admin 01 PR #13](https://github.com/thedanieldiya/nosee-new/pull/13) and Neon TLS [PR #15](https://github.com/thedanieldiya/nosee-new/pull/15) **merged**. Owner reports a non-public-development Neon database and initial Super Admin configured for the existing Vercel main deployment, migrations applied and **6/6 Super Admin browser acceptance checks passed**. Original A01 Editor and scoped Research Group Lead interactive checks remain open; no independent production-release or security approval. [Architecture/setup](admin/architecture.md) · [Tracker](admin/TRACKER.md). **Next: A02 invitation/administrator management and Activity log; implementation not started.**

Canonical [PRD](PRD.md), [public status/deferred release checklist](PUBLIC-SITE-STATUS.md), [merged-task tracker](FRONTEND-TRACKER.md), [Admin TRD v1.2](admin-dashboard-trd.md) and [Admin Dashboard delivery tracker](admin/TRACKER.md) remain authoritative. **Admin A01 is merged: 1/13 admin tasks merged. Owner has confirmed the six Super Admin interactions, but cross-role testing is still open, so full A01 approval is not recorded. Every admin task requires an owner-interactive check and independent review outcome.** Development completion does not mark broader release/full-stack requirements Done.

## Phase status

| Phase | Status | Remaining scope or acceptance |
| --- | --- | --- |
| P0–P3 | Done — original public-port development milestone | Discovery/foundation/homepage/About/Events delivered through PRs #1–#11; approved exceptions retained. Release gates tracked separately. |
| P4 | Not started | Approved missing public pages, accurate content and working critical links |
| P5 | In review — A01 owner Super Admin checks passed | A01 code merged and owner reports hosted development main sign-in/profile/auth checks 6/6 passed. **Editor and scoped Lead authorization walkthroughs remain; A02 not yet implemented.** |
| P6 | Not started | Membership applications/private review/reliable email; no applicant login |
| P7 | Not started | CMS/research/public people/media/site/monitoring publication workflows |
| P8 | Not started | Public release checklist, live checks, indexing, security/rollback and field performance |

## Requirement progress

Statuses: `Not started`, `In progress`, `Blocked`, `In review`, `Done`. A development-only completion below is explicitly qualified; release acceptance is not inferred.

| ID | Status | Delivered / outstanding |
| --- | --- | --- |
| CORE-01 | In progress | Public App Router works; private full-stack/admin boundary later |
| CORE-02 | Done — public migration | Source tokens/typography/components and authorised MingCute/currentColor; future admin follows TRD |
| CORE-03 | In progress | Literal typed records and original business rules ported/tested; factual approval and future CMS/validation remain |
| PUB-01 | Done — code migration | Complete five-section homepage and shell; release/content decisions separate |
| PUB-02 | Done — code migration | Complete responsive About/leadership; placeholder approval separate |
| PUB-03 | Done — code migration | Events/search/archive/eight details/meeting redirect; original date/query rules preserved |
| PUB-04 | Not started | Additional approved public pages |
| PUB-05 | In progress | Real SSR 404, exact meeting 302, fixture noindex; critical links/metadata/sitemap/canonicals/indexing/live verification remain |
| ADM-01 | In review — Super Admin owner checks passed | Real Neon-backed Better Auth, one-time Super Admin creation and owner sign-in/logout/anonymous redirect passed on main's nonlaunch deployment. Cross-role review and independent security validation remain. |
| ADM-02 | In review — owner Super Admin journey passed | Shadcn/MingCute shell, role Overview, current-user General details/edit persistence and unavailable-module labels were owner-tested. Editor/Lead browser walkthroughs still outstanding. |
| MEM-01 | Not started | Public application form |
| MEM-02 | Not started | Private admin review |
| MEM-03 | Not started | Applicant/admin/status emails |
| MEM-04 | Not started | Private membership and explicitly curated public profiles |
| CMS-01 | Not started | News/events publishing |
| CMS-02 | Not started | Site/monitoring resource management |
| CMS-03 | Not started | Media validation and audit safety |
| NWS-01 | Not started | Real newsletter provider/consent/delivery; current honest error, no native POST |
| OPS-01 | Not started | Production security, provisioning, backup and rollback safeguards |
| PERF-01 | In review — interim accepted | Task 11 mobile Lighthouse 3.535s, images 415,255B; ≤2.5s and field CWV/INP deferred. No new optimisation/benchmark in Task 12. |
| QA-01 | In review | Task 12 checks below; automated checks do not complete manual AT/live/content acceptance |

## Decisions and deferred release gates

- The owner authorised one Task 12 to combine technical close-out and full current-tree cleanup. Historical Git commits and merged PR links remain; no history rewrite or new evidence archive.
- Source copy/fixture facts, original URL inconsistencies and responsive text stay unchanged. Approved hero entrance, MingCute glyphs, accessibility/no-JS/image changes, cold decode wait, honest newsletter error and custom 404 are recorded in [public status](PUBLIC-SITE-STATUS.md#implemented-scope-and-enduring-exceptions).
- **Deferred:** manual screen-reader/voice/magnifier review; actual Vercel/domain/DNS/field performance; factual/legal/DOI/people/media approval; missing public destinations/old AGM 404; real newsletter delivery; indexing/SEO/launch decisions. Noindex retained and production settings untouched.
- **Later technical work:** undersized hero/About indicators, inherited 320px Events overflow, mixed scalar/array search edge and original ≤2.5s LCP target. No silent fixes in Task 12.
- Deferred public release gates remain separate from A01 development. A01 is merged and owner-tested for Super Admin, but original Editor and scoped Lead owner-interactive review remains outstanding. No later admin task is started.

## Task 12 close-out

- **Authorisation/scope:** combined cleanup explicitly requested after Task 11 merge; branch-only review. No application feature/refactor, further performance optimisation, admin, PR/merge or production setting change.
- **Clean baseline:** `npm ci` from the unchanged lockfile; all **110 existing tests**, typecheck, lint, production build and whitespace checks pass before cleanup.
- **Fixture preservation:** original records/asset hashes, selectors/date boundaries and all **29** full PHP listing/presentation/archive scenarios preserved in compact independent runtime fixtures. The 2.23MB repeated oracle is replaced by canonical full-output hashes plus original input deltas; expectations come only from pinned PHP artifacts. One focused hash-integrity test added; all original tests remain.
- **Cleanup:** all **424 migration artifacts / 99,542,493 bytes (99.54 MB)** and **12 completed migration briefs** removed from current tree. Disposable renderer/capture scripts deleted; durable code/tests/fixtures/runtime assets/package lock/source-map/design docs/PRD/Admin TRD/future admin brief retained. Historical ledger compressed into these forward-looking requirements, decisions and PR links.
- **Post-cleanup checks:** **111/111 Node tests** (110 retained + one fixture-integrity case), typecheck, lint, production build and whitespace pass. Production: **35 HTTP checks / ten detail boundary cases**, plus six homepage/About/Events/search/archive responses with noindex, **46 media URLs** and decoded responsive hero at **390/768/1440px**, three homepage UTC date selections. Browser hardening: **14 axe scans**, ten JS/no-JS viewport cases, 30 About anchors, solid Events keyboard focus and zero runtime errors; only deferred indicator target-size findings remain. Project Markdown: **75 local links / zero broken targets or headings**, zero removed-path references and zero tracked migration artifacts/briefs. Initial test-clock native-method omission corrected outside Git and all affected checks rerun. MingCute audit: **549 state samples / 13,080 SVG checks / 18 enabled/disabled fixtures**, zero colour mismatches. Local production browser checks used Chromium 154.0.8037.57 and frozen UTC `2026-10-14T12:00:00Z` except explicit boundary cases. No application/dependency/assets/Admin TRD/admin-brief changes; logs remain temporary.
- **Publication/live:** implementation/cleanup **`f58639edf8a96e387958811b20621fac79a6baeb`** pushed to [codex/task-12-public-closeout-cleanup](https://github.com/thedanieldiya/nosee-new/tree/codex/task-12-public-closeout-cleanup); remote/local heads matched via `git ls-remote`. This publication record follows in a documentation-only commit. Read-only GitHub deployment status and actual `https://nosee-new.vercel.app` requests returned HTTPS CONNECT **403**; live deployment/domain/preview remain **unverified**, not passed. No preview URL guessed, PR created, merge performed or production settings changed. Stop for owner review.

## Admin A01 — 15 October 2026

- **Scope:** implemented on `codex/admin-01-foundation`, no PR/merge, production changes or A02. [Backend/operator setup](admin/architecture.md) selects Better Auth 1.7.9, Drizzle 0.45.4 and pg 8.23.1; official compatibility guidance plus actual PostgreSQL 17 integration. No hosted DB/auth bindings, purchased resources or production identities.
- **Security/function:** real hashed credentials and signed HttpOnly/SameSite/Secure-on-HTTPS cookies; fixed eight-hour database sessions with no cookie cache/sliding refresh; current role/scope/deactivation reread on protected access. Masked interactive-only first Super Admin CLI with transaction lock/permanent audit marker, repeat/race/elevation refusal. Origin/CSRF checks, bounded/allowlisted input, atomic cross-instance account throttling, own-name persistence and real password/logout revocation. Future routes are guarded/unimplemented, not fake editors.
- **Checks:** **116/116 unit/public tests**, **15 PostgreSQL integration cases**, typecheck/lint/production build/whitespace pass. Browser: nine role/width walkthroughs plus password/offline failure checks; **67 axe scans / zero violations**, **514 SVG/text observations / zero mismatches**, 320px/forced-colour/dark/reduced-motion/focus states. Manual AT remains unrun. Missing config/unreachable DB fail closed while public reading stays available.
- **Public regression:** 36 settled captures / 18 zero-RGB-difference pairs, six routes at 390/768/1440; 25 HTTP/302/404 checks. Five public client manifests have no admin/Radix/Better Auth modules. Sample decoded public JS +1,224B/one small Next authorization-boundary script; no admin code leaks or new CWV claim. Public code/data/assets unchanged except scoped CSS discovery/security headers. Mobile LCP ~3.54s remains the accepted historical baseline.
- **Dependencies/evidence:** PostCSS patched to 8.5.30; zero runtime audit advisories. Five inherited high lint-chain alerts through unpatched braces remain documented. Only six masked representative dashboard screenshots (~270KB), concise [review](admin/reviews/01-foundation.md), essential runtime migrations/tests; bulk logs/credentials/QA stay temporary.
- **Review/publication:** implementation **`ef2a1e608d69b70929faee957100078de6ad0ccb`** pushed to [codex/admin-01-foundation](https://github.com/thedanieldiya/nosee-new/tree/codex/admin-01-foundation); `git ls-remote` matched local HEAD. This publication record follows in a documentation-only commit. GitHub status lookup returned HTTPS CONNECT 403. **Preview blocked**: Vercel access returns 403; no actual branch URL, hosted DB/role accounts or owner interactive approval claimed. Owner must configure an isolated Preview PostgreSQL DB, `DATABASE_URL`, `BETTER_AUTH_SECRET`, exact `ADMIN_ORIGIN` (optional direct migration URL), run migrations/bootstrap securely and supply the actual deployment URL/access mechanism. No secret values in chat/Git. Stop for A01 review, no A02.

## Update protocol

Record only actual current results, scoped commits/PRs, changed requirement statuses and unresolved gates. Keep this file concise; put generated logs/screenshots/oracles in temporary or CI storage. Do not change acceptance criteria to pass a milestone. Future public UI changes require appropriate responsive/source checks; secure admin tests follow [Admin 01](admin/01-foundation.md). Stop after each assigned task and leave PR/merge/production control with the owner.
