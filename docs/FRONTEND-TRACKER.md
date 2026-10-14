# NOSEE — Existing Laravel frontend migration tracker

**Updated:** 2026-10-14  
**Scope:** strict 1:1 port of the public pages/routes *actually implemented* in the pinned Laravel source. Not the future dashboard, CMS, membership/email, or unimplemented public pages.  
**Current baseline:** [Task 10 PR #10 merged](https://github.com/thedanieldiya/nosee-new/pull/10) at `7326c06`; **all ten original Laravel frontend migration tasks are merged**. [Task 10 audit](evidence/task-10/README.md) reports 101 tests, 150 source/baseline comparisons with only approved icon differences, and remaining accessibility/performance/release gates. Public release/owner acceptance is **not** established by merging. [Proposed Task 11](codex-tasks/11-public-release-hardening.md) is a targeted high-priority remediation plan, **not authorised or implemented**.

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

**Progress:** **10/10 migration tasks merged**. This is **code-delivery progress only**, not publication, visual-signoff, accessibility, field-performance or production approval.

## Proposed next milestone (requires separate owner approval)

- [Task 11 — public-site critical accessibility and mobile-performance hardening](codex-tasks/11-public-release-hardening.md): proposed, **not running**. Task 10 measured mobile LCP ~15.084 s Lighthouse / 18.772 s direct throttling, 2.68:1 dark-footer secondary text, 4.14:1 Events meeting badge, accessible-name/focus and no-JS navigation defects. These require **explicitly authorised visible changes**, not silent Laravel-parity fixes. Keep strong cross-route/source regression evidence.
- After an owner review of Task 11 fixes and manual assistive-technology/live checks, carry out the already-agreed **separate cleanup PR** removing all temporary `docs/evidence/` artifacts while preserving essential functional tests/docs and leaving Git history intact.
- Continue with **approved future work**: new public pages (P4) and/or the locked [Admin Dashboard TRD](admin-dashboard-trd.md) (P5–P7), with implementation order set by owner. Neither is part of the completed ten-task port.

## Quality and release conditions

- Source/target visual and behavior checks remain **mandatory** at applicable responsive widths, including date-dependent events, navigation, forms and appropriate accessibility/performance checks.
- **Owner-approved MingCute UI icon replacement:** Test every updated icon's inherited `currentColor` against adjacent link/button/label text for normal/hover/focus/selected/disabled states, including dark/green surfaces. Any icon-shape differences from Laravel are approved; non-icon geometry/text/behaviour must remain unchanged. See [Task 10](codex-tasks/10-final-frontend-icons-review.md).
- Owner must approve the final exact public-site port, its documented exceptions and use of content. Historical Laravel development fixtures are **not** approved organisational facts; several public pages remain deliberately **noindex**.
- Tracked migration artifacts previously accumulated under `docs/evidence/` (notably Task 08). **Keep all evidence until Task 09 is finished and the final Task 10 parity review is accepted.** Then carry out a **separate owner-approved cleanup PR** deleting **all** migration evidence files/screenshots/raw outputs from the current tree, preserving essential reusable tests, application code and concise ongoing docs. No Git history rewrite.
- Codex must **run** comprehensive tests/screenshot comparisons but keep bulky generated outputs in temporary or CI artifact storage; only short summaries and a few representative comparison pairs are allowed in new task commits.
- Known release gates remain: unverified organisation fixtures, missing routes/critical links, source no-JS menu/close icon, newsletter integration, indexing and deployment decisions. [Final findings](evidence/task-10/README.md#accessibility-and-ordered-owner-decisions) also document contrast/label/target/focus/reflow issues, an inherited mixed-query parsing difference and unavailable manual assistive-technology testing. Local mobile LCP is ~15s in Lighthouse / 18.77s under direct throttling; optimization needs separate approval.

**Later scope, separate roadmap:** P4 approved new public pages, P5 shadcn/admin authentication, P6 membership and email, P7 content publishing/CMS, P8 operational production readiness. These are **not** counted in the ten tasks above.

Detailed requirement-level evidence and blockers: [PROGRESS.md](PROGRESS.md). Canonical requirements: [PRD.md](PRD.md). Owner's coding policy: [AGENTS.md](../AGENTS.md).
