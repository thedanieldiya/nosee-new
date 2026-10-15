# Public-site development status

**Updated:** 15 October 2026. The original Laravel frontend migration and [Task 12 close-out/cleanup PR #12](https://github.com/thedanieldiya/nosee-new/pull/12) are **merged** as a development milestone. All migration evidence and completed task briefs were deleted from the current tree; functional code, assets and reusable tests are retained. **Public launch is not approved by this milestone.**

## Implemented scope and enduring exceptions

The complete homepage, About, Events listing/search/archive, eight regular event details, meeting redirect and shared 404 use the pinned [Laravel implementation](https://github.com/thedanieldiya/nosee/tree/9872c4ed12aa48835eab71065c69b468424adb4a). Existing copy, responsive text variants, slugs, assets, crops, layout, timezones and selection rules remain authoritative; fixtures are not verified organisational facts. See the [source map](migration-map.md) and [design reference](visual-baseline.md).

Owner-authorised differences are retained:

- Six-stage hero entrance enabled although the pinned renderer played none; other inactive section reveals remain inactive.
- General UI uses official MingCute glyphs exclusively, inheriting adjacent text/control `currentColor` in every state. Logos and scientific imagery remain original content assets.
- Eight homepage rasters use 32 exact-aspect AVIF/WebP variants with original fallbacks, intrinsic dimensions and lazy below-fold loading. Hero order, 6s autoplay, 400ms transition and 50px swipe remain; a cold selection waits for image decoding while retaining the current frame.
- Confirmed footer/meeting contrast, visible-name alignment and Events keyboard-focus defects corrected. No global colour-token or copy changes.
- Mobile navigation without JavaScript is a native disclosure in document flow; the JavaScript drawer retains its modal interactions. Close glyph and About anchor clearance corrected.
- Newsletter retains its original appearance but reports an honest error, with no email transmission or false success. Native no-JS POST is unimplemented.
- Meeting requests return **HTTP 302**, exact `Location: https://icelli.nosee.org`, including HEAD/query/encoded/trailing-slash cases. Missing public/event routes return real SSR **404**; invalid uppercase event slugs return Next 404 instead of the Laravel loader's 500. The owner authorised the 404 design to match the existing system.

## Accepted interim performance

Task 11's **normal-motion Lighthouse mobile median LCP 3.535s (~3.54s)** is accepted for current development; its three-run range was 2.865–4.585s. Homepage cold mobile image bodies were **415,255 B**, versus 3,936,230 B before hardening (−89.45%). No new performance measurements or optimisation belong to Task 12.

Those historical lab results used Lighthouse 13.5.0, Chromium 154.0.8037.57, local production, fresh cache, 412×823 at 1.75× density, simulated Slow 4G/4× CPU, three alternating runs per version. They are not live, real-device, field p75 or INP measurements. **The original LCP ≤2.5s goal is deferred, not passed**; field INP ≤200ms and CLS ≤0.1 remain release goals.

## Deferred release checklist

These gates remain open and do not alone block the separately approved admin-development phase:

- **Manual accessibility:** owner-assisted screen-reader, voice-control and magnifier review on representative devices; automated axe/keyboard checks are not WCAG certification.
- **Live operations:** verify the actual Vercel deployment/preview, domain/DNS, redirects, CDN behaviour, field performance and rollback. Codex's HTTPS CONNECT requests currently return 403; no deployment success or preview URL is asserted.
- **Content and rights:** approve organisation/person/news/event/DOI fixtures, biographies, source wording inconsistencies, contact/social links, image/attribution rights and legal content. Development records remain unapproved.
- **Routes and delivery:** separately implement approved missing public destinations (including news, publications and the other [mapped routes](migration-map.md#2-actual-route-inventory)); the original old AGM destination remains 404. Newsletter needs a real provider, consent/storage and delivery; no fake subscription success.
- **Indexing and launch:** content remains deliberately `noindex, nofollow`; decide approved metadata/canonicals/sitemap/indexing and launch only after content and operational approval. No production settings changed in close-out.
- **Deferred technical issues:** undersized hero/About carousel indicators; inherited 320px Events overflow (339px document width); mixed scalar/array query parsing edge; ≤2.5s LCP target. No silent corrections or further optimisation in Task 12.

## Cleanup, verification and traceability

Task 12 removes all **424 temporary migration artifacts (99,542,493 bytes; 99.54 MB decimal)** and all **12 completed migration task briefs** from the current tree: **436 files / 99,717,844 bytes (~99.72 MB)** altogether. Git history and merged [PRs #1–#11](FRONTEND-TRACKER.md) retain historical accountability. No evidence archive, screenshot matrix or new generated report is committed. Source-map/design requirements, PRD, Admin TRD, future admin brief, application code, package lock, original/runtime image assets and reusable tests remain.

Test dependencies are preserved as the small [runtime fixture](../tests/fixtures/public-content.json): canonical SHA-256 expectations for complete original records and all 29 PHP listing/presentation/archive scenarios, original synthetic input deltas, selector boundaries and media hashes. Key-order-independent hashes preserve full-output equality without the 2.23 MB repeated oracle export; a focused test checks value/type/array-order sensitivity. No expected value is regenerated from the Next implementation.

Task 12 local verification results are recorded in [PROGRESS](PROGRESS.md). The original 110 tests remain, with one fixture-integrity test added. Logs/browser outputs stay outside Git. Reproduce the routine gate with:

```bash
npm ci
node --test tests/*.test.mjs
npm run typecheck
npm run lint
npm run build
git diff --check
npm run start
```

Use `tests/check-event-routes.mjs TARGET` for HTTP/redirect/404 checks and its optional test clock for boundaries. `tests/check-public-hardening.cjs TARGET /tmp/results.json /path/to/axe.min.js` and `tests/check-public-icon-colours.cjs TARGET /tmp/colours.json` use externally available Playwright/Chromium; outputs must stay outside the checkout. Fresh PHP detail comparisons remain available through `tests/compare-event-details.mjs` and its reusable oracle helper against an isolated pinned source renderer.

The next development task is [Admin 01 — secure foundation](admin/01-foundation.md), governed by [Admin Dashboard TRD v1.2](admin-dashboard-trd.md). Admin implementation has **not started**; the manual, live and content release gates remain deferred.
