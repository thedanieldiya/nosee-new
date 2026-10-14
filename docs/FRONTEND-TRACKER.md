# Original Laravel frontend migration tracker

**Updated:** 14 October 2026. **Development milestone complete:** all ten original public-port tasks plus hardening merged. Content, accessibility and production acceptance are separate; see [public-site status and deferred release checklist](PUBLIC-SITE-STATUS.md).

| Task | Delivered scope | Traceability |
| --- | --- | --- |
| 01 | Laravel discovery/source map/design baseline | [PR #1](https://github.com/thedanieldiya/nosee-new/pull/1) merged |
| 02 | Next.js foundation/tokens/primitives | [PR #2](https://github.com/thedanieldiya/nosee-new/pull/2) merged |
| 03 | Public navigation/footer | [PR #3](https://github.com/thedanieldiya/nosee-new/pull/3) merged |
| 04 | Hero/carousel/approved entrance | [PR #4](https://github.com/thedanieldiya/nosee-new/pull/4) merged |
| 05 | Monitoring dashboard | [PR #5](https://github.com/thedanieldiya/nosee-new/pull/5) merged |
| 06 | Research/news/events homepage sections | [PR #6](https://github.com/thedanieldiya/nosee-new/pull/6) merged |
| 07 | Complete About/leadership carousel | [PR #7](https://github.com/thedanieldiya/nosee-new/pull/7) merged |
| 08 | Events listing/search/archive | [PR #8](https://github.com/thedanieldiya/nosee-new/pull/8) merged |
| 09 | Event details/meeting 302/shared 404 | [PR #9](https://github.com/thedanieldiya/nosee-new/pull/9) merged |
| 10 | MingCute/currentColor and full public review | [PR #10](https://github.com/thedanieldiya/nosee-new/pull/10) merged |
| 11 | Authorised accessibility/no-JS/responsive images | [PR #11](https://github.com/thedanieldiya/nosee-new/pull/11) merged |
| 12 | Combined sanity checks/release register/complete artifact cleanup | **In review** on `codex/task-12-public-closeout-cleanup`; [verification/publication](PROGRESS.md#task-12-close-out) |

Mobile normal-motion Lighthouse LCP **3.535s** is accepted for now; ≤2.5s remains a deferred target, not a passed criterion. No further performance work in Task 12. Historical migration artifacts/briefs are removed as explicitly authorised; source/code/tests and Git history remain.

Public changes must preserve source layout, wording, routes, responsive behaviour and the [documented approved exceptions](PUBLIC-SITE-STATUS.md#implemented-scope-and-enduring-exceptions). Run appropriate source/target comparisons for future visual changes and keep generated QA outside Git. Official MingCute glyphs and adjacent-text `currentColor` apply to both public and future admin UI; admin code must stay out of public bundles.

**Next after owner merge:** [Admin 01 — secure foundation](admin/01-foundation.md), with the approved [Admin TRD v1.1](admin-dashboard-trd.md). Admin is **not started**. Deferred manual AT/live/content release gates do not imply failed development close-out or block that separately authorised phase; they remain open before public launch.

[PRD](PRD.md) · [requirement progress](PROGRESS.md) · [agent instructions](../AGENTS.md)
