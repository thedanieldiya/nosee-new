# NOSEE — Existing Laravel frontend migration tracker

**Updated:** 2026-10-14  
**Scope:** strict 1:1 port of the public pages/routes *actually implemented* in the pinned Laravel source. Not the future dashboard, CMS, membership/email, or unimplemented public pages.  
**Current baseline:** destination `main` includes [merged PR #8](https://github.com/thedanieldiya/nosee-new/pull/8) (commit `5a15a55`); Task 09 instructions are ready; its application code is **not** implemented.

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
| 09 | Event details, meeting HTTP 302, source 404 | [Instructions ready](codex-tasks/09-event-details-and-404.md); code not started |
| 10 | Final existing-source frontend QA and owner acceptance | Planned, not started |

**Progress:** 8/10 tasks merged. This is **task-count progress, not percent engineering effort, acceptance or launch readiness**.

## Quality and release conditions

- Source/target visual and behavior checks remain **mandatory** at applicable responsive widths, including date-dependent events, navigation, forms and appropriate accessibility/performance checks.
- Owner must approve the final exact public-site port, its documented exceptions and use of content. Historical Laravel development fixtures are **not** approved organisational facts; several public pages remain deliberately **noindex**.
- Tracked migration artifacts previously accumulated under `docs/evidence/` (notably Task 08). **Keep all evidence until Task 09 is finished and the final Task 10 parity review is accepted.** Then carry out a **separate owner-approved cleanup PR** deleting **all** migration evidence files/screenshots/raw outputs from the current tree, preserving essential reusable tests, application code and concise ongoing docs. No Git history rewrite.
- Codex must **run** comprehensive tests/screenshot comparisons but keep bulky generated outputs in temporary or CI artifact storage; only short summaries and a few representative comparison pairs are allowed in new task commits.
- Known release gates remain: unverified editor/organisation fixtures, missing future informational routes and critical links, source no-JS menu behavior, newsletter integration, indexing decision, low-bandwidth performance and public deployment verification.

**Later scope, separate roadmap:** P4 approved new public pages, P5 shadcn/admin authentication, P6 membership and email, P7 content publishing/CMS, P8 operational production readiness. These are **not** counted in the ten tasks above.

Detailed requirement-level evidence and blockers: [PROGRESS.md](PROGRESS.md). Canonical requirements: [PRD.md](PRD.md). Owner's coding policy: [AGENTS.md](../AGENTS.md).
