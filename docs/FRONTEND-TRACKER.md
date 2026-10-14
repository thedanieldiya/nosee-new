# NOSEE — Existing Laravel frontend migration tracker

**Updated:** 2026-10-14  
**Scope:** strict 1:1 port of the public pages/routes *actually implemented* in the pinned Laravel source. Not the future dashboard, CMS, membership/email, or unimplemented public pages.  
**Current baseline:** destination `main` includes [merged PR #9](https://github.com/thedanieldiya/nosee-new/pull/9) (commit `aad5980`); the **original Laravel public frontend routes are all ported**. [Task 10](codex-tasks/10-final-frontend-icons-review.md) instructions prepared, implementation **not started**. Owner-approved MingCute icon migration and final source frontend acceptance remain.

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
| 10 | MingCute icon consistency + final existing-source frontend QA | [Instructions ready](codex-tasks/10-final-frontend-icons-review.md); code not started |

**Progress:** **9/10 tasks merged**. This is **task-count progress, not percent engineering effort, acceptance or launch readiness**.

## Quality and release conditions

- Source/target visual and behavior checks remain **mandatory** at applicable responsive widths, including date-dependent events, navigation, forms and appropriate accessibility/performance checks.
- **Owner-approved MingCute UI icon replacement:** Test every updated icon's inherited `currentColor` against adjacent link/button/label text for normal/hover/focus/selected/disabled states, including dark/green surfaces. Any icon-shape differences from Laravel are approved; non-icon geometry/text/behaviour must remain unchanged. See [Task 10](codex-tasks/10-final-frontend-icons-review.md).
- Owner must approve the final exact public-site port, its documented exceptions and use of content. Historical Laravel development fixtures are **not** approved organisational facts; several public pages remain deliberately **noindex**.
- Tracked migration artifacts previously accumulated under `docs/evidence/` (notably Task 08). **Keep all evidence until Task 09 is finished and the final Task 10 parity review is accepted.** Then carry out a **separate owner-approved cleanup PR** deleting **all** migration evidence files/screenshots/raw outputs from the current tree, preserving essential reusable tests, application code and concise ongoing docs. No Git history rewrite.
- Codex must **run** comprehensive tests/screenshot comparisons but keep bulky generated outputs in temporary or CI artifact storage; only short summaries and a few representative comparison pairs are allowed in new task commits.
- Known release gates remain: unverified editor/organisation fixtures, missing future informational routes and critical links, source no-JS menu behavior, newsletter integration, indexing decision, low-bandwidth performance and public deployment verification.

**Later scope, separate roadmap:** P4 approved new public pages, P5 shadcn/admin authentication, P6 membership and email, P7 content publishing/CMS, P8 operational production readiness. These are **not** counted in the ten tasks above.

Detailed requirement-level evidence and blockers: [PROGRESS.md](PROGRESS.md). Canonical requirements: [PRD.md](PRD.md). Owner's coding policy: [AGENTS.md](../AGENTS.md).
