# Codex Task 07 — Complete About page, strict Laravel 1:1

**Milestone:** P3 — migrate the **entire existing `/about` frontend** in one cohesive increment, including every editorial section, responsive variant, leadership carousel and fragment navigation. **Acceleration means fewer handoffs, not fewer tests or visual checks.**  
**Writable repository:** `thedanieldiya/nosee-new`. Start `codex/task-07-about-page` from the **latest `main`**, containing merged [Task 06 PR #6](https://github.com/thedanieldiya/nosee-new/pull/6), merge SHA `5f36500ee5b658be22eff45e89de1de637069588`.  
**Read-only Laravel source:** `thedanieldiya/nosee` at exact SHA `9872c4ed12aa48835eab71065c69b468424adb4a`.  
**Contracts and evidence:** `AGENTS.md`; [strict 1:1 PRD](../PRD.md); [migration map](../migration-map.md); [visual baseline](../visual-baseline.md); [progress](../PROGRESS.md); and [Task 03 shell](../evidence/task-03/README.md), [Task 05 monitoring](../evidence/task-05/README.md), [Task 06 full-homepage evidence](../evidence/task-06/README.md) for pinned Laravel + target browser comparison.  
**Git workflow:** Finish on isolated branch, **commit and push only**. Owner handles PR creation/merge after visual review. Report Vercel URL only if verified; owner can inspect locally otherwise.  
**Excluded:** modifying the homepage, navigation/footer/brand tokens, Events, CMS/shadcn/admin/auth, newsletter integration, data provider, unrelated fixes, new content, About copy/imagery refresh or performance optimizations that alter original rendering.

## 1. Non-negotiable fidelity and quality gates

The owner's instruction is **a literal, 1:1 translation of actual rendered Laravel UI**—not a new design. This task is page-level, but **all About subsections and carousel states must be inspected and verified independently**.

- Preserve **exact visible source text**, punctuation (including the en dash/em dash/curly apostrophes), hierarchy, spacing, image variants/crops, grid breakpoints, original URLs, keyboard/focus/hover behavior and responsive conditional visibility.
- **Do not “correct” the actual source**: the page includes `John Doe` attribution, seven `Leadership profile 0N` records with `Role to be confirmed`, description text that openly refers to a “mockup”, and intentionally different descriptions at mobile, tablet and desktop. These are legacy development fixtures; migrate **literally** and flag publication/content approval separately. Do not invent portraits, biographies, dates, institution claims or destinations.
- Avoid the trap of forcing all viewports to show the same editorial description: conditional text spans and `<picture>` sources are explicitly different across `lg`/`xl`.
- Do not copy outdated Laravel PRD aspirations in place of the actual Blade/JS behavior. Don't activate unobserved animations. The earlier permission for Task 04's homepage hero entrance is **specific to the homepage**, not to About.
- Each of these are required: source data equality, subsection geometry/rendering, stateful carousel behavior, complete-page captures, regression checks, focused tests, a clean production build. Do not claim parity if captures differ without documenting the precise discrepancy.

## 2. Read the actual source first

**Required pinned files:**
- `resources/views/about/index.blade.php` (**every line**; intro, mission, numbered objectives, quote, story, leadership, collaboration and all responsive grid classes).
- `resources/views/components/about/profile-carousel.blade.php` (**every line**, including slide/item/control semantics and Tailwind).
- `content/about.php` (the complete literal record).
- `resources/js/profile-carousel.js` and `tests/JavaScript/profile-carousel.test.js` (grouped indicators, arrow/wrap/swipe/resize behavior).
- `app/Http/Controllers/AboutController.php`, `app/Services/Content/AboutContentService.php`, `tests/Feature/AboutPageTest.php`.
- `resources/views/layouts/app.blade.php`, `resources/views/components/ui/{container,button,arrow-right}.blade.php`, `resources/css/app.css`, `resources/js/app.js` and `content/navigation.php` for the expanded-header-offset/internal-route rules and About anchors.
- Six original media under `public/media/about/`:
  `earth-space-environment-mobile.png`, `earth-space-environment-tablet.png`, `earth-space-environment.png`, `solar-observation-tablet.png`, `solar-observation.png`, `earth-from-space.png`.
- Destination public layout `src/app/(public)/layout.tsx`, current `SiteNavigation`/`NavigationController`/`SiteFooter`, `Container`/`ButtonLink`/`ArrowRight`, `tokens.css`, `globals.css`, and the existing homepage.
- [About visual-baseline entries](../visual-baseline.md), including source section spacing and unavailable previous screenshots.

**Reference:** Recreate isolated pinned Laravel runtime using the **existing** Task 03–06 evidence procedure. No changes to legacy repo, package installation in legacy, rebuilt old assets, or invented reference screenshots.

## 3. Port the entire About content as literal typed data

Create `src/lib/content/about.ts` (or directly matching local convention) with a small, typed immutable export corresponding to **every value** of `content/about.php`. Independently compare full exported JSON/object to pinned source PHP at the target boundary, including:
- `page_title='About NOSEE'` and intro eyebrow/headline, **three** intro descriptions (`description_mobile`, `description_tablet`, `description`), **two** closing statements and **three** responsive intro images;
- mission title, **three** distinct mission statements, **three ordered objectives** with two descriptions per objective;
- quote text, `John Doe` attribution, two quote-image variants;
- story title/lead/body and its image;
- leadership title/intro and **seven ordered profile name/title/image/alt records** (images are reused; don't invent portraits);
- collaborations eyebrow/title/description and the three literal actions `Participate → /participate`, `Partner with NOSEE → /partnerships`, `Support NOSEE → /support`.

**Files and assets:** Copy all six original PNGs byte-for-byte with exact case, names and paths. Verify source vs destination SHA-256, natural sizes and HTTP 200. Source asset sizes: **458,044 + 279,329 + 149,280 + 106,358 + 93,620 + 394,947 = 1,481,578 bytes**. These are file sizes, not guaranteed initial transfer; avoid double-counting reused leadership images.

Do not introduce a CMS/DB/remote content feed or pretend these fixtures have been approved for publication.

## 4. Reproduce the About editorial page exactly

**Route:** `src/app/(public)/about/page.tsx` at `GET /about`, server-rendered with **`About NOSEE | NOSEE`** document title. Keep shared `main#main-content`/skip link and nav/footer from Task 03.

**Important layout difference:** Unlike home, Laravel sets `navigationOverlaysContent=false`. Its **`main` has top padding `pt-[var(--expanded-navbar-offset)]` before an About `article.pb-24.lg:pb-32`**. Current Next public layout doesn't have that padding for secondary routes. Provide the **same measured About-only expanded-header offset**, without altering the homepage's overlaid header or making the entire public app a client component. It may be implemented as a route-scoped wrapper if that produces identical geometry. Don't duplicate the header, offset it twice, or hide content beneath the fixed nav.

**Every section, in source order, with exact DOM semantics/classes where practical:**

**A — About intro:** shared `Container` `pt-[84px] lg:pt-20`; heading grid `lg:grid-cols-8` / `xl:grid-cols-12`, source `h1` “About NOSEE” and separate large headline. Text sizes **22/30 → xl 24/32** for page label and **36/42 → lg 46/54 → xl 56/64** for headline. Intro picture: native `<picture>` with original source selection at **≥1280 desktop**, **≥1024 tablet**, otherwise mobile, native `img width=370 height=260 fetchPriority=high`; height 260/360/400 per breakpoints. Source eyebrow, description variant spans and closing-statement variants must retain exact visibility, line wrapping and borders/gaps. Preserve the source's unusual 8-/12-column placements, not a generic two-column split.

**B — `#mission`:** `scroll-mt-32`, `h2#mission-heading`, original top margins, 8/12-column statement layout and responsive mobile/tablet/desktop statement variants. Three ordered `<li>` objectives with number `01/02/03`, original column/spacing/borders and shorter mobile description. **Last objective has special `lg` span and inner grid**; reproduce it, don't standardize the three cards.

**C — Quote:** source `<blockquote>`, fixed 390px mobile height, 320px at `lg`, 330px at `xl`; brand green background, oversized opening quotation glyph, exact quote, “- John Doe” italic attribution. On mobile the solar image **does not render visibly**; on ≥1024px use original picture with tablet vs desktop sources at 1280px. Preserve crop/column width, hidden image state, background and padding. No new quote graphics.

**D — Our Story:** source spacing after quote **184px mobile / 61px at lg / 120px at xl**, editorial grid, image `width=752 height=500 loading=lazy` with original `earth-from-space.png`, source height 300/430/500 and exact content/crop, lead and development-copy body. Do not replace the original image just because natural pixels are 468×430.

**E — Leadership carousel:** original section `id='leadership'`, carousel semantics and `scroll-mt-32`, intro, narrow brand bar, **seven exact placeholder profiles**, square photos, upper/lower borders and caption styling. **Functional contract is in section 5.**

**F — `#collaborations`:** the original border-top, eyebrow “Collaboration”, long headline and description, XL grid and action nav with exact links/destination, focus and hover underline/border colors. Preserve source heading/aria labels and fragment IDs.

All subsections must use the same spacing as the source; **don't coalesce into cards or "clean up" the editorial layout.** The About route must be meaningful server-rendered HTML with JavaScript disabled.

**Indexing:** Since this source contains unapproved organisation/person fixtures and the homepage is still explicitly `noindex`, keep About **temporarily `noindex,nofollow`** until owner content approval. This is an **invisible, disclosed publishing-safety exception** from legacy metadata, not permission for any visible change. Do not automatically index the full site.

## 5. Port the real profile carousel (small About-only client island)

The source carousel (`profile-carousel.js`) is **not** the hero carousel. Reproduce the actual functional contract, while keeping the page and profile content server-rendered:

- Seven profiles total; visible **1** at `<640px`, **2** at `640–1023px`, **3** at `≥1024px`. Source slide widths `w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4rem)/3)]` and track gaps `gap-4 lg:gap-8`; native 400ms ease-in-out transform, reduced motion disables transition.
- **Arrow buttons** appear at `sm` and above and step **one individual profile per click**, wrapping around. The source may show a partially empty window near wrap; preserve actual behavior, not a more “intuitive” paginator.
- **Indicators** are rendered as seven source buttons but hide those beyond page count: 7 mobile / 4 tablet / 3 desktop. Indicators jump by **one full responsive group** (index × profiles per page); active dot derives from `floor(currentIndex / profilesPerPage)`, not arrow count. Preserve source dot colors, 8px size, label changes (`Show profile N` vs `Show profiles N to M`), `aria-current` and hidden state.
- Translate using `-slides[currentIndex].offsetLeft`. Keep source active first profile initially; correctly set visible slides' `aria-hidden=false`/`inert=false` and mark out-of-view slides hidden/inert when JavaScript runs. Avoid a hydration flash or broken visible first image.
- **Pointer swipe only on mobile below 640px**, ≥50px horizontal distance and greater horizontal than vertical displacement, both directions with wrapping; ignore short/vertical gestures, reset on pointercancel. No autoplay.
- On viewport breakpoint/resize change, **preserve currentIndex** and update visible count, slide state, indicator pages and offset. Don't reset to 0 or snap differently because it seems nicer.
- Preserve arrow/icon style, keyboard focus/activation, 400ms transition, skip and fragment behavior, responsive image loading/alt and original ARIA roles/labels. Test no-JS baseline separately. Tiny `useEffect` controller or equivalent route-scoped island is fine, but do not ship a third-party carousel library or include this in homepage bundles.
- **Technical hygiene:** Clean up all attached listeners and observers on component unmount/remount (source has no teardown; React requires one to prevent duplicate event registration). This is a lifecycle implementation detail, not a visible design change. Only deviate from source on accessibility/safety if required and document it.

**Important:** Existing navigation component initialized with `getNavigationState("/")` was written when only `/` existed. Verify that `/about` highlights **About NSEE** correctly on **direct page load and client navigation**, including its mobile submenu/anchor links. Fix only a verified issue, and do not introduce unrelated navbar redesign or link-text changes.

## 6. Independent verification for each About section and interaction

**Source/target browser images:** Capture the same **390×844, 768×1024, 1024×768, 1280×900, 1440×1000** sizes at the **pinned Laravel renderer** and Next **production** server (same DPR, installed font faces, selected `<picture>` candidate, zoom, motion preference, settled navbar). Minimum paired crops at 390/768/1440 **for every major subsection**, and **full-page screenshots at 390 and 1440**. Full five-width geometry measurements are required even when screenshots are limited by tooling. Save actual source+target PNGs with a readable index, viewport info and reproducible process.

**State checks:** In addition to first-load captures, compare pinned source and target **leadership first/last group**, desktop previous/next arrow click, indicator jumping, 390px mobile swipe, 768px two-profile and 1024px three-profile breakpoint, window resize, source focus treatment and reduced-motion transition. Verify 7/4/3 page dots, per-profile `aria-hidden`/`inert`, and no idle autoplay. Check `#mission`, `#leadership` and `#collaborations` anchor scroll positions both via direct URL fragment and in-page navigation; verify header doesn't cover heading.

**Automated checks:** At least focused tests for complete literal About data, seven profiles and action URL/anchor labels, viewport variants and picture sources, carousel initial state, arrow steps/wrap, group dots, 50px swipes, resize/current preservation, reduced motion and cleanup. Use existing native Node test machinery; no unrelated dependency or framework install. Run `npm run typecheck`, `npm run lint`, focused About tests, `npm run build` and `git diff --check` near completion. Rerun only failures after fixes.

**Route/build checks:** `GET /about` returns HTTP 200 and full SSR content; all About asset requests HTTP 200; no browser JS errors, console warnings or horizontal overflow. Existing `GET /` still serves all five sections; verify nav/hero/footer regressions on representative widths and original homepage tests continue to pass. Maintain About SSR without JS and source no-JS mobile navbar defect as separately tracked.

**Evidence:** `docs/evidence/task-07/README.md` plus PNG captures and small source/target geometry/state logs. Compare actual RGB pixels **and** element geometry/line wrapping; if different, fix before acceptance or describe exact discrepancy. No unsupported parity, WCAG certification, Lighthouse/CWV or production-live assertions. Don't overcollect screenshots that merely repeat the same state; focus on each meaningful section/breakpoint/state.

**Performance visibility:** Record which original About images load on cold mobile vs 1440px, and actual encoded resource bodies where practical; file bytes across six originals total **1,481,578**, but loaded subset depends on `<picture>`/lazy/slides. Do not change source `loading`, `srcset` or image crops to hide the current low-bandwidth performance problem; later owner-approved zero-visible-change optimization remains separate.

## 7. Progress, branch, owner review and stop

1. Work only in `codex/task-07-about-page` from the **merged Task 06 main**. Leave the legacy tree untouched.
2. Update `docs/PROGRESS.md`: record [Task 06 PR #6](https://github.com/thedanieldiya/nosee-new/pull/6) merged and the reported 22 identical paired captures / 33 focused passing tests. **P2/PUB-01 stay In review** until owner signs off visual/content/SEO gates; don't silently mark Done merely because merged. Mark P3 In progress and PUB-02 In review **only when About implementation and source/target evidence exist**, not when task instructions are written.
3. Keep previous source no-JS mobile menu/close-icon, newsletter honesty exception, hero entrance approval, unapproved fixtures/noindex, missing linked public routes and ~3.94MB homepage cold-image issue visible in tracker. Don't "fix" them within About.
4. Commit and push branch. No auto PR/merge, no production settings changes. If Codex cannot fetch Vercel status, say so; local running server is valid frontend review evidence, not proof of production domain routing.
5. Final handoff includes branch/full commit, source-to-target mappings, all six media hashes, original content validation, visual comparison results by About subsection, 1/2/3-profile carousel state checks, route/nav fragment checks, test/typecheck/lint/build status, measured image loads, known exceptions and actual preview URL only if verified.
6. **STOP.** Do not begin Events before owner review. Suggested subsequent **Task 08**: original Events listing/search and archive, in one cohesive increment with thorough state/temporal checks.

### Acceptance

`/about` is a visually faithful, complete server-rendered replica of the Laravel About page, including intro variants, mission/three objectives, quote, story, seven-profile responsive carousel, collaboration actions and correct internal-route header offset, with original byte-matched assets, exact literal content, functioning original JS interactions and independent pinned-renderer visual/behavior evidence. **Speed never excuses skipped tests or visual regressions.**
