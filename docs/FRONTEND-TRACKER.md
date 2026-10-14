# NOSEE — Existing Laravel frontend migration tracker

**Updated:** 2026-10-14  
**Scope:** strict 1:1 port of the public pages/routes *actually implemented* in the pinned Laravel source. Not the future dashboard, CMS, membership/email, or unimplemented public pages.  
**Current baseline:** All 10 original public frontend port tasks [merged through PR #10](https://github.com/thedanieldiya/nosee-new/pull/10). [Task 11 PR #11 merged](https://github.com/thedanieldiya/nosee-new/pull/11), adding owner-approved accessibility and responsive-image improvements: 110 passing tests; cold mobile image bytes down 89.45%; mobile Lighthouse median LCP **3.535s**. The owner accepts **~3.54s provisionally for development**. [Task 12 combined final-check/deferred-gate/evidence cleanup](codex-tasks/12-public-closeout-cleanup.md) is **prepared but not implemented**; [Admin Foundation](admin/01-foundation.md) follows its merge.

| Task | Scope | Delivery state |
| --- | --- | --- |
| 01 | Laravel discovery and baseline | [PR #1 merged](https://github.com/thedanieldiya/nosee-new/pull/1) |
| 02 | Next.js foundation, tokens and primitives | [PR #2 merged](https://github.com/thedanieldiya/nosee-new/pull/2) |
| 03 | Public navigation and footer | [PR #3 merged](https://github.com/thedanieldiya/nosee-new/pull/3) |
| 04 | Homepage hero and carousel | [PR #4 merged](https://github.com/thedanieldiya/nosee-new/pull/4) |
| 05 | Homepage monitoring dashboards | [PR #5 merged](https://github.com/thedanieldiya/nosee-new/pull/5) |
| 06 | Research, news and events homepage sections | [PR #6 merged](https://github.com/thedanieldiya/nosee-new/pull/6) |
| 07 | Entire About page | [PR #7 merged](https://github.com/thedanieldiya/nosee-new/pull/7) |
| 08 | Events listing, search and archive | [PR #8 merged](https://github.com/thedanieldiya/nosee-new/pull/8) |
| 09 | Event details, meeting HTTP 302, source 404 | [PR #9 merged](https://github.com/thedanieldiya/nosee-new/pull/9) |
| 10 | MingCute icon consistency + final existing-source frontend QA | [PR #10 merged](https://github.com/thedanieldiya/nosee-new/pull/10); [audit findings](evidence/task-10/README.md) remain open for owner release review |
| 11 | Owner-authorised post-port public hardening (A–D only) | [PR #11 merged](https://github.com/thedanieldiya/nosee-new/pull/11); 110 passing tests, image payload −89.45%, mobile Lighthouse median 3.54s |

**Progress:** **11/11 public frontend migration/hardening tasks merged** (the ten original port tasks plus the accessibility/performance follow-up). This is **development delivery**, not content/indexing/production/manual AT clearance. Next: **one combined Task 12 close-out and cleanup**, then the approved **Admin Dashboard foundation**.

## Owner's streamlined handoff

- [Task 11](https://github.com/thedanieldiya/nosee-new/pull/11) is merged, with [compact historical findings](evidence/task-11/README.md). Mobile LCP ~3.54s is **accepted for now**, although the original 2.5s optimization target is deferred rather than met.
- The remaining **technical check, truthful deferred-release ledger and deletion of every migration-evidence file** are now **one owner-authorised [Task 12](codex-tasks/12-public-closeout-cleanup.md)**, branch-only for the owner's single PR/merge. Remove obsolete migration task briefs after updating evergreen links; preserve tests/code/TRD.
- **Manual screen-reader/voice-control/magnifier testing, actual live-domain and field performance, content/DOI/legal approval, missing new public routes, newsletter delivery, indexing and production launch** remain **deferred release gates**, not checks that Codex may falsely pass. Existing medium issues and the 2.5s target are for later owner prioritization.
- After Task 12 merges, start [Admin Dashboard Foundation](admin/01-foundation.md) (P5) against the locked [Admin TRD v1.1](admin-dashboard-trd.md). No admin development in the Task 12 cleanup branch.

## Quality and release conditions

- Source/target visual and behavior checks remain **mandatory** at applicable responsive widths, including date-dependent events, navigation, forms and appropriate accessibility/performance checks.
- **Owner-approved MingCute UI icon replacement:** Test every updated icon's inherited `currentColor` against adjacent link/button/label text for normal/hover/focus/selected/disabled states, including dark/green surfaces. Any icon-shape differences from Laravel are approved; non-icon geometry/text/behaviour must remain unchanged. See [Task 10](codex-tasks/10-final-frontend-icons-review.md).
- Owner must approve the final exact public-site port, its documented exceptions and use of content. Historical Laravel development fixtures are **not** approved organisational facts; several public pages remain deliberately **noindex**.
- The owner has **explicitly approved** final migration-evidence deletion as one **Task 12 combined close-out PR**, after the Task 11 merge. Remove **all** temporary `docs/evidence/` files and obsolete completed migration task docs in that PR; preserve reusable tests, brand/auth contracts, functional assets/code, the Admin TRD and evergreen documentation. The source history remains intact; don't rewrite Git history or falsely certify public launch.
- Codex must **run** comprehensive tests/screenshot comparisons but keep bulky generated outputs in temporary or CI artifact storage; only short summaries and a few representative comparison pairs are allowed in new task commits.
- Known release gates remain: unverified organisation fixtures, missing routes/critical links, manual assistive-technology review, newsletter integration, indexing and deployment decisions. [Task 11](evidence/task-11/README.md) resolves confirmed contrast/name/Events-focus/no-JS defects; indicator sizes, 320px Events reflow and mixed-query parsing remain excluded follow-ups. Manual AT/live review and further approved performance work remain; local Lighthouse mobile LCP is 3.54s, above goal.

**Later scope, separate roadmap:** P4 approved new public pages, P5 shadcn/admin authentication, P6 membership and email, P7 content publishing/CMS, P8 operational production readiness. These are **not** counted in the ten tasks above.

Detailed requirement-level evidence and blockers: [PROGRESS.md](PROGRESS.md). Canonical requirements: [PRD.md](PRD.md). Owner's coding policy: [AGENTS.md](../AGENTS.md).
