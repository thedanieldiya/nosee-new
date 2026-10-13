# Codex Task 04 — Strict 1:1 homepage hero and carousel

**Phase:** P2, second bounded increment — homepage hero only.  
**Destination:** `thedanieldiya/nosee-new`. Create `codex/task-04-homepage-hero` from the **latest `main`** after the owner's merged Task 03 PR #3.  
**Legacy source:** `thedanieldiya/nosee` at pinned commit `9872c4ed12aa48835eab71065c69b468424adb4a`, strictly **read-only**.  
**Canonical rules:** `AGENTS.md`, `docs/PRD.md` (owner's strict 1:1 directive), `docs/migration-map.md`, `docs/visual-baseline.md`, `docs/PROGRESS.md`, and [Task 03 evidence](../evidence/task-03/README.md).  
**Delivery:** Commit and **push only the task branch** so Vercel generates a preview. **No automatic pull request or merge.** Stop for owner review.  
**Deliverable:** Replace the root foundation specimen with the **exact two-slide Laravel homepage hero**, with original images/text/positions/responsiveness/indicators/autoplay/swipe/entrance animation, while retaining the merged Task 03 navigation and footer. Do not build the remaining four homepage sections.

## Non-negotiable 1:1 visual and content rule

The owner has explicitly required a literal **one-to-one public-site migration**. This is a PHP/Blade → Next.js/React technical conversion, **not** an opportunity for art direction, editorial editing, graphic redesign, optimization that changes visible output, or UX "improvements."

- Match the **actual Laravel source HTML and observed rendering**, not the legacy PRD's unrealized ideas or stale test assertions. Use the pinned source commit throughout.
- Preserve **every byte of source-visible content**, including capitalization, punctuation, typos, credit text, labels, source URLs and broken destinations. In particular, do **not** correct `Colloquim` to `Colloquium` in the first title, alter `Annual general meeting` capitalization, "fix" the second credit's `Credit:Photo` spacing, or change the second CTA URL to a different slug.
- Do not introduce new imagery, gradients, CSS effects, hero layouts, arrow navigation, new CTA labels, controls, spinners, artificial content, dots styling, or responsive typography.
- Preserve even unintuitive source behaviors, such as the desktop autoplay and the fixed 750px mobile height. Content/business issues and old source/test/PRD conflicts are documented **only** for a separately authorized correction.
- Where Next.js cannot duplicate the source exactly or accessibility/security constraints force a deviation, write a precise source/target difference in the evidence log. **Do not describe a near match as verified pixel equality.**

## 1. Required source inspection before coding

Read the actual Laravel implementations and tests:

1. `resources/views/components/home/hero.blade.php` — the full hero markup, Tailwind classes, accessibility attributes, data hooks, hero track, stationary black overlay, slide panels, CTA and indicator placement.
2. `content/homepage.php` — exact two editorial records, fields, array ordering and URLs.
3. `resources/views/pages/home.blade.php` — homepage composition; preserve the hero as the first section.
4. `app/Services/Content/HomepageContentService.php` and `app/Http/Controllers/HomeController.php` — explain why hero items originate from the file record and why the homepage navigation overlays content.
5. `resources/js/hero-carousel.js` — timing, swipe/focus/visibility/transition behavior.
6. `resources/js/homepage-animations.js` and `resources/js/app.js` — staged hero entrance, exact easing, reduced-motion behavior and how Motion is loaded only for the homepage.
7. `resources/css/app.css`, `resources/views/layouts/app.blade.php` and the source `Container`/`Button`/`ArrowRight` primitives.
8. `tests/JavaScript/hero-carousel.test.js` — read for behavior, **but note its `h-[78svh]` expectation is stale relative to the actual 750px source template**.
9. Original bytes and dimensions for `public/media/home/hero-1.png` and `public/media/home/hero-2.jpg`.
10. Current Next `src/app/(public)/page.tsx`, public layout/navigation, SiteFooter, global CSS/tokens, `src/lib/content/`, current site UI primitives and small client-controller patterns from Task 03.

Reference screenshots can now be generated from the **same isolated pinned local Laravel renderer used successfully for Task 03**; consult `docs/evidence/task-03/README.md` for its setup. The live `nosee.org` site might remain inaccessible, but the pinned source renderer is valid evidence when clearly identified as such. Never modify or install dependencies into the legacy working tree.

## 2. Port the exact two hero records

Create a small, typed, immutable content export under `src/lib/content/` (follow Task 03's established convention). Include only the actual `hero.items` records from `content/homepage.php`, in original array order and with original field spelling and values:

- **Slide 1:** `id=icelli2026`, eyebrow `Scientific Meeting`, exact long `International Colloquim ... / ICELLI2026` title, original full summary, `/media/home/hero-1.png`, precise source image alt and NASA visualization credit, CTA `Read` to `/events/icelli2026`.
- **Slide 2:** `id=nosee-annual-general-meetings`, eyebrow `Conference`, exact AGM title/summary, `/media/home/hero-2.jpg`, precise source image alt and Unsplash credit, CTA `Read` to `/events/nosee-annual-general-meeting`.

Do not retype long strings from memory or paraphrase: transfer and independently compare to the actual source PHP arrays. Keep the second CTA's unmatched destination exactly, mark it as a known source defect, and **do not create an Events page** in this task. Copy the two images under the exact `public/media/home/` filenames and verify their hashes/byte equality to pinned source. If images already exist, do not duplicate.

## 3. Reconstruct the hero geometry exactly

Implement a reusable `HomeHero` server-rendered component (e.g. `src/components/site/sections/HomeHero.tsx`); any small interactive controller must have a narrow client boundary rather than hydrating the whole homepage.

Preserve the original source's entire DOM semantics and positioning, notably:

- Outer carousel section: `relative h-[750px] touch-pan-y overflow-hidden bg-primary text-inverse lg:h-[850px]`, carousel region/labels and `data-homepage-motion`/`data-home-hero`/`data-hero-carousel`.
- Inner absolute image track: horizontal flex, each image slide is 100% width/height with `overflow-hidden`; original `400ms` translate transition/easing. Slide 1 initially active.
- Original images use `width=1440` and `height=850` attributes; first `fetchPriority="high"`, subsequent lazy, source alt and source order. **Mobile** image is the *same* image cropped within a **968px-wide centered frame** and not simply an automatically sized full-width responsive image; **desktop** is full-width cover. Preserve `object-cover object-center` and the actual first/second source photos. No substitutions.
- The dark overlay `bg-black/75` remains **stationary** outside the moving image track.
- Original shared Container wraps absolute content panels. Each panel is independently faded/blurred (400ms) with correct active/hidden/`inert` state, native paragraph/heading CTA markup and source announcement semantics.
- Exact mobile text-block geometry: `top-1/2 mt-20 left-4 right-4 -translate-y-1/2 gap-5`; desktop ≥1024: `left-[120px] right-auto mt-10 w-[852px] gap-0`. Do not "center the content more nicely."
- Eyebrow: `rounded-[2px] bg-white/40 px-2.5 py-1.5 text-xs leading-4 text-primary uppercase`.
- Title: Ubuntu Sans `text-[28px] leading-8 font-semibold`; ≥1024 `text-[56px] leading-[64px]`.
- Summary: `max-w-[525px] text-base`; ≥1024 `text-xl`; original inter-element gap and CTA margin.
- CTA: source Button `size=lg`, icon right, `gap-10 px-6 tracking-[0.06em] uppercase`, source arrow glyph. If the Task 02 `ButtonLink` needs a small narrowly scoped extension to match, keep changes minimal, source-faithful and backward-compatible.
- Image credit: exact source text, **hidden on mobile**, desktop only, `right-[120px] bottom-[75px] max-w-[294px] text-right text-sm leading-[18px]`.
- Controls: only if multiple slides; original 12px border-white circular indicators with correct filled/empty state, `bottom-4` / `lg:bottom-8`, `lg:ml-[88px] xl:ml-14`, native button labels. **Do not add prev/next arrows** (the implemented Blade source has none).

Integrate with the already migrated Task 03 transparent/scrolling navigation **without altering its approved dimensions or mobile/footer behavior**. The public shell should overlay this hero as the source does; **remove the Task 02 preview-only top offset when replacing the specimen**. Preserve the existing Next root skip link and accessible `main`. Do not introduce a duplicate navbar, body scroll pad, extra section margin, or fabricated below-hero filler.

## 4. Reproduce the source interactive carousel

Port `hero-carousel.js` behavior, not a new carousel design. A small client island or DOM controller is acceptable provided the server renders the initial slide correctly.

- **Initial slide 1**, indicators reflect first slide; inactive content has `aria-hidden=true` and `inert`. Images are appropriately hidden from accessibility tree as source.
- On desktop at `min-width:64rem`, **autoplay every 6000ms** only when multiple slides, no reduced-motion preference, tab visible, carousel not hovered/focused.
- Pause/restart the fresh 6000ms delay on hover in/out, focus in/out of the hero, document visibility and viewport/motion preference changes.
- Clicking an indicator selects that exact slide; indices wrap; synchronize image track, content visibility/fade/blur/inert state and indicators/`aria-current`.
- **400ms transition lock** for normal motion; reduced-motion skips transition locking and autoplay. Keep native Tailwind `motion-reduce` styles and maintain final visible state even when animations are disabled.
- Mobile/tablet below 1024px: deliberate horizontal pointer swipes with **≥50px** displacement and |horizontal| > |vertical|; support both directions and wrap. Preserve vertical page scrolling and cancel behavior.
- One-item edge case has no controls, no timer, no needless listeners.
- Any Next/client-controller event listeners, timeouts and RAFs must be cleaned up on unmount/route change, without duplicating listeners under React Strict Mode.
- Must render meaningful initial content even with JavaScript disabled; do **not** claim the known separate Task 03 mobile nav no-JS defect is fixed.

Avoid large third-party carousel libraries or full-page client hydration.

## 5. Match the actual hero entrance animation

The legacy `homepage-animations.js` uses Motion only on the homepage. Reproduce the six source entrance stages **without inventing new easing/scale/transitions**:

| Stage | Original start | Duration | Motion |
| --- | --- | --- | --- |
| Background visual wrapper | 0.00s | 0.65s | opacity 0→1, scale 1.02→1 |
| Eyebrow | 0.18s | 0.40s | opacity 0→1, translateY 12→0 |
| Title | 0.32s | 0.60s | opacity 0→1, translateY 20→0 |
| Summary | 0.48s | 0.50s | opacity 0→1, translateY 16→0 |
| CTA | 0.64s | 0.45s | opacity 0→1, translateY 12→0 |
| Credit + indicators | 0.82s | 0.40s | opacity 0→1 |

- Use source easing `[0.22,1,0.36,1]`. Animate once on homepage load, targeted to the source data attributes. Keep the carousel track transform separate from the entrance visual wrapper, as the Blade markup does.
- With `prefers-reduced-motion: reduce`, render the untouched, fully visible server HTML without entrance effects. Never hide content waiting for a JS animation to run.
- Prefer a tiny, carefully matched native Web Animations implementation if it reproduces the exact sequence. If verified parity requires the same `motion/mini` package as source, a **homepage-only lazy-loaded import** is allowed; record its additional download cost and keep it out of other public routes. Do not silently omit the entrance animation to improve performance.
- Don't implement **below-the-fold section-reveal animations** in this task; those belong to the later homepage-section tasks.

## 6. Page composition while the homepage is incomplete

- Replace `src/app/(public)/page.tsx` foundation specimen with **only** the source hero in this increment; do not include its specimen color grid/buttons below the hero. Existing navigation/footer must render unchanged.
- `/` therefore contains **the real hero followed directly by the shared footer temporarily**. This is an intermediate implementation, **not the finished homepage**. The actual source has monitoring → research outputs → trending news → upcoming events after the hero; do not create blank/fake placeholders or invent content here.
- Preserve the source homepage document title `NOSEE`. Because the page is **incomplete**, retain a **page-specific** `robots: {index:false,follow:false}` on the temporary destination until all public homepage sections have passed review. This is an interim SEO safety setting, not part of the visible Laravel design; disclose it in the report.
- Do not port About/Events routes, the footer newsletter backend or any admin functionality.
- Do not overwrite Task 03 evidence or visual shell tests. Any future component architectural improvements must wait for another scoped task.

## 7. Visual evidence and focused checks (lightweight)

Build source/reference captures using the pinned, isolated Laravel rendering process described in `docs/evidence/task-03/README.md`. Run the Next **production build** and capture the target at matching **390×844, 768×1024, 1024×768, 1280×900 and 1440×1000** viewports (at minimum 390/768/1440), fixed DPR/locale/time zone/fonts. Do not change the source DOM or content for captures.

Required reference **and** target screenshots/crops:

1. Initial **first slide** after entrance settles at 390, 768 and 1440px; preserve expanded nav over hero and note footer appears early in destination because other sections are not yet ported.
2. **Second slide** after clicking indicator at each width, including image crop, title/CTA/credit and active dot.
3. Desktop **hover-paused carousel** and **compact navbar after 25px scroll**, as separate observed states.
4. Mobile **swipe** outcome, reduced-motion state and CTA keyboard-focus visibility.
5. Optional one short screenshot sequence/video if needed to verify the staggered hero entrance stage timings, but don't create a big test harness.

Compare actual reference and target hero **crop/viewport region**, not misleading full-page diffs: the incomplete destination intentionally lacks the four below-hero sections. Record overlay/geometry/text wrapping/dimensions/credits/indicator differences and whether exact parity is demonstrated. Screenshots do not prove animation timings by themselves; record the behavioral checks separately.

Targeted programmatic checks, no sprawling test suite:
- Literal two-slide source record equality (including source typo and unmatched URL); original media hashes/dimensions.
- First slide SSR/without-JS visibility, slide selection, desktop autoplay + hover/focus/hidden pauses, mobile swipes, reduced motion, 400ms transition lock, active/inert/`aria-current` state, and single-slide no-timer edge case.
- Header/footer unchanged on the key widths, no missing assets or unintended broken **media** requests, no horizontal overflow.
- Run `npm run typecheck`, `npm run lint`, focused hero tests, `npm run build` **once near the end** and `git diff --check`. Re-run only failing checks after fixes. Do not run the entire Laravel/PHP test suite, install Playwright if already present, or add unrelated test frameworks.
- Record measured encoded JS/CSS/font/image transfers where readily available, including both originals and first-load image behavior. **Do not change image appearance or crops to meet provisional budgets without approval**; list possible lossless/visually equivalent future optimizations for review, and do not claim Core Web Vitals targets without measured evidence.

Write concise captured-reference/target mapping and checks to `docs/evidence/task-04/README.md`, adding necessary small screenshot files and optional machine-readable evidence. Avoid huge artifacts.

## 8. Progress, push and stop

1. Work only in `codex/task-04-homepage-hero` created from the latest, merged `main`. Verify Task 03 PR #3 is included. No code changes in Laravel.
2. Update `docs/PROGRESS.md` with Task 03's owner-reported merge/acceptance and Task 04's true status. P2 remains **In progress** or **In review for this increment**; **do not mark PUB-01 Done** until all five real homepage sections are migrated and visually accepted. Preserve P0, the separate no-JS navigation defect, and performance gates honestly.
3. Commit the code and evidence; **push the branch**. No PR creation or merge is required or authorized.
4. Let Vercel deploy the pushed branch. Include the actual branch-specific preview URL/status **only if verified**. If Codex's network blocks it, say `preview URL unavailable from Codex` and provide the GitHub branch URL so the owner can view it in Vercel. Never invent a preview URL or confuse `nosee-new.vercel.app` (main) with the task branch.
5. Final response must include branch/full commit, what was ported, exact copy/assets/timing checks, source/target screenshots, lint/typecheck/test/build results, known discrepancies and image weights, progress status and **one** recommended next bounded task for the monitoring dashboard section.
6. **STOP** after pushing and wait for the owner's visual review. Do not proceed into monitoring/research/news/events, admin or backend changes.

### Acceptance

A source-faithful, initially server-rendered two-slide hero occupies `/` underneath the already migrated navigation, with correct source typography/geometry/overlays/media, intact original copy/CTA destinations, indicators/swipes/autoplay/reduced-motion/entrance, focused tests and source-to-target reference screenshots. The hero may be accepted as one P2 increment, but the **full homepage remains unfinished** and must not be marked visually complete.
