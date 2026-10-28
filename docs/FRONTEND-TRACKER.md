# Original Laravel frontend migration tracker

**Updated:** 27 October 2026. **Development milestone complete:** all ten original public-port tasks plus hardening merged. Content, accessibility and production acceptance are separate; see [public-site status and deferred release checklist](PUBLIC-SITE-STATUS.md).

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
| 12 | Combined public sanity checks, release register and artifact cleanup | [PR #12 merged](https://github.com/thedanieldiya/nosee-new/pull/12), 436 files (~99.72 MB) removed; 111 tests, build/typecheck/lint and route checks passed |

Mobile normal-motion Lighthouse LCP **3.535s** is accepted for now; ≤2.5s remains a deferred target, not a passed criterion. No further performance work in Task 12. Historical migration artifacts/briefs are removed as explicitly authorised; source/code/tests and Git history remain.

Public changes must preserve source layout, wording, routes, responsive behaviour and the [documented approved exceptions](PUBLIC-SITE-STATUS.md#implemented-scope-and-enduring-exceptions). Run appropriate source/target comparisons for future visual changes and keep generated QA outside Git. Official MingCute glyphs and adjacent-text `currentColor` apply to both public and future admin UI; admin code must stay out of public bundles.

**Admin development:** A01–A09 core milestones merged (**9/13**), including [A07 PR #26](https://github.com/thedanieldiya/nosee-new/pull/26) and [A07.1 correction PR #27](https://github.com/thedanieldiya/nosee-new/pull/27). Conventional News `/news`/article layouts are approved to implement and now built, with owner visual/workflow acceptance pending. [Current scope/setup](admin/07-1-news-workflow-public-wat-toasts.md) and [merged follow-up PR #28](https://github.com/thedanieldiya/nosee-new/pull/28). Completion fixes merged in [PR #29](https://github.com/thedanieldiya/nosee-new/pull/29). [A07.2 password/revision corrections](admin/reviews/07-2-password-news-revisions.md) merged in PR #30 and are owner-tested per the A08 brief. [A08 Events](admin/08-events-publishing.md) merged in PR #31, with owner walkthroughs pending. [A09 Publications](admin/09-publications.md) merged in PR #32; owner walkthroughs/live DOI checks remain pending. [A10 Site content](admin/10-site-content.md) implements hero/Leadership publishing, public snapshots and the A04 identity picker on its separate review branch; owner acceptance remains open. Public Research design remains separate; standard DOI publication-page design is implemented on the A09 review branch. Only group deletion/focus-area removal are owner-confirmed for A06; live Resend/schedules, uploads, privacy and manual AT/public launch remain pending. This repo is a production candidate; One Smart Space transfer is optional.

[PRD](PRD.md) · [requirement progress](PROGRESS.md) · [agent instructions](../AGENTS.md)
