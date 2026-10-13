# Codex Task 03 — Public navigation, footer and responsive shell (strict 1:1)

**Phase:** P2, first bounded increment — shared public shell only.  
**Scope authority:** [docs/PRD.md](../PRD.md), especially the owner's **strict 1:1 public migration directive**.  
**Read first:** [migration map](../migration-map.md), [visual baseline](../visual-baseline.md), [progress tracker](../PROGRESS.md), [AGENTS.md](../../AGENTS.md).  
**Destination (writable):** `thedanieldiya/nosee-new`; create `codex/task-03-public-shell` from the latest `main`.  
**Legacy reference (strictly read-only):** `thedanieldiya/nosee` @ `9872c4ed12aa48835eab71065c69b468424adb4a`.  
**Preview workflow:** Push the branch only. **Do not create a PR or merge.** Vercel will deploy the branch preview; give the owner the **actual deployed preview URL** if accessible.  
**Out of scope:** Full homepage content, About, Events, new pages, admin dashboard, CMS, auth, DB, member applications, newsletter integration, new brand redesign.

## Mandatory instruction: an exact public-site replica, not an interpretation

**The user has explicitly directed that EVERYTHING from the existing Laravel public site be migrated as a 1:1 replica: visual layout, written content, hierarchy, order, imagery, fonts, responsive behavior, navigation paths, animations and working interactions.**

Do not exercise design or editorial creativity. **Do not improve, simplify, modernize, normalize, correct, reword, restyle, or replace any public-facing element on your own.** Translating Blade to React and Laravel-style data to typed TypeScript is a technical change; the browser result must remain the same. Reuse the original Tailwind utility patterns and breakpoints where practical rather than approximating them with arbitrary new design choices.

**Specific examples of things NOT to silently change:** `NSEE` spellings in legacy text; existing typos and viewport-specific copy; sample/fixture content; navigation/footer link labels or destinations; external social placeholder URLs; logo proportions; ordering of utility items; newsletter form copy; CTA text; hero behavior (when migrated in a later task). Flag potential inaccuracies separately under `docs/PROGRESS.md` for owner-approved content correction in a later task. **A 1:1 migration is not permission to claim that placeholder content is true.**

The existing Laravel **implementation** is the reference for routed public UI and behavior; do not substitute aspirational directions from the old Laravel PRD or invent missing details. Exact pixel parity remains **unverified** until comparable reference screenshots exist. Where compatibility, accessibility or security requires a deviation, make the smallest possible difference and explicitly list it for owner review; never pass an altered design off as exact.

### Explicit existing-functionality exception: newsletter

The Laravel newsletter endpoint only logs and does not subscribe the user. Copy the **existing form's at-rest appearance and source text exactly**, including its placement, label, input, Subscribe button, validation/error markup and original confirmation markup where useful for later work. **Do not create a fake success handler, store private email addresses without an approved backend, or tell a visitor an email subscription succeeded.** Until the approved newsletter backend is implemented, a submission may surface the **existing** error text "Unable to subscribe right now. Please try again." with no fake success; explain this narrowly scoped behavioral exception in the handoff. Do not visually redesign or remove the form.

## 1. Study the real Laravel implementation

Inspect all of these source files, not just the audit summaries:

- `resources/views/layouts/app.blade.php` and `resources/css/app.css`.
- `resources/views/components/navigation/desktop-navigation.blade.php`.
- `resources/views/components/navigation/desktop-primary-links.blade.php`.
- `resources/views/components/navigation/mobile-navigation.blade.php`.
- `resources/views/components/footer/site-footer.blade.php`.
- `app/View/Components/Navigation/Navigation.php` (enabled/active/current rules).
- `resources/js/navigation-state.js` and `resources/js/mobile-navigation.js`.
- `resources/js/newsletter.js` and `app/Http/Controllers/NewsletterSubscriptionController.php` (to identify what is and is not truly functional).
- `content/navigation.php` and `content/site.php`, plus the source footer content/validation service.
- Source `public/logoWhite.png` and footer social SVGs in `public/media/icons/`, preserving exact filenames, case and aspect ratios.
- Existing Next.js `src/app/layout.tsx`, `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/styles/tokens.css`, and the three public primitives from Task 02.

Review source layout markup carefully before deciding on React server/client component boundaries. Keep public records typed and minimal, without creating a CMS.

## 2. Port the actual source data, literally

- Create small typed `src/lib/content/` exports (or equivalent) for the **existing** site/navigation/footer data. Keep item order, nested children, enabled flags, labels, URLs, target behaviors, contact/address/social content, newsletter copy, legal links and copyright as they appear in Laravel.
- In particular, **do not change `About NSEE` or `Join NSEE` into new spellings**, do not swap social placeholder URLs for other links or disable them to "improve" accuracy. Document content concerns for later owner approval.
- Preserve all intended links even where the destination route is not yet implemented; these will temporarily lead to 404 pages until later P2–P4 tasks. Do not invent pages to avoid 404s, retarget URLs to `#`, or make the menu less complete than the original.
- The source utility `Login` link is not a functioning member-auth product. Preserve its displayed source appearance and link/path (`/login`) for parity, **but do not build authentication**. Flag it as a known nonfunctional legacy route.
- Implement the source's navigation active/current logic precisely: normalize root-relative paths, mark exact route current, nested paths active, bubble active child up to parent, preserve About fragment links, use current-page indication on the correct links. Do not treat fragments as distinct route paths.
- Preserve the source mobile/desktop responsive content ordering and any source conditional visibility. No editorial rewriting.

## 3. Recreate desktop navigation pixel-for-pixel

- At viewport width `lg` and above, render the exact two-tier fixed, black/70 background header with `backdrop-blur-[10px]`, inverse text and source logo.
- Expanded header height **140px** at `lg`, **164px** at `xl`; compact **104px**. Preserve shared container gutters, logo and content-region heights, utility alignment, top-row separation, border opacity, text sizes and focus/hover treatments.
- Match the source utility row (News, Multimedia, Support NOSEE, Login account icon) and the source primary row order and spacing.
- **Only "Data & Products" has a desktop hover/focus-within dropdown**. The About and Research children are **not** added as desktop dropdowns.
- For the original scrolling rule, expanded at `scrollY <= 24` and compact at `scrollY >= 25`, preserve CSS height transitions and reduced-motion treatment; synchronize desktop/mobile header state with a tiny client controller or boundary, not a client-rendered public app.
- When there is no JavaScript, all essential content and links should remain readable/accessible to the extent implemented in the source.

## 4. Recreate mobile navigation pixel-for-pixel

Below 1024px (including 390px and 768px):

- Fixed **72px brand-green top bar** with exact support button/account icon placement, hamburger/cross appearance and 44px control hit area.
- Expanded black/70 logo band beneath it with blur, source logo proportions, source margins/padding and collapse behavior after scrolling; do not invent an alternate mobile masthead.
- Modal-like, full-width white drawer opening under the 72px band; original black overlay, scroll locking and restoration, stacking layers and menu typography/spacing.
- Main link rows retain their independent links and separate expand/collapse buttons. Preserve submenu labels, ordering, mutually exclusive open state and auto-opening of the active submenu.
- Opening the drawer focuses its first available item; Tab/Shift+Tab stays within the open drawer, Escape/overlay/menu-toggle closes it and restores appropriate focus. Closing via links and crossing into desktop viewport resets the drawer and submenus. Match `aria-expanded`/`aria-controls`/`aria-modal` and hidden/inert behavior.
- Maintain the source no-JS fallback so primary and child links are not inaccessible when JavaScript is disabled. No large modal/navigation third-party library.

## 5. Recreate the source footer pixel-for-pixel

- Port the full layout of `site-footer.blade.php`, including dark background, copyright/legal divider, social icon masks, logo image, support CTA, contact/actions, links and newsletter group.
- Preserve source responsive order: **mobile** organisation → newsletter → contacts → link groups. At `lg` use the source twelve-column spans (organisation 3 / contacts 3 / links 2 / newsletter 4), original vertical padding, group gaps and divider spacing.
- Keep literal title/text/copy/contact values and exact external link behaviors (`target="_blank"` and `rel="noopener noreferrer"`) where source uses them. Do not remove external social links just because they are unverified placeholders; flag their status in the report.
- Preserve source social SVG icon shapes/case, mask sizing, source hover/focus styles and native email/tel actions.
- Preserve the original newsletter **at-rest** layout, label, placeholder, input size, Subscribe button, disabled/error styles and source text. Do not silently remove newsletter from the footer. Avoid a false successful-subscription response; see exception above.
- Preserve document reading order, semantic landmark structure, original legal labels and spacing; reuse existing `Container`/`ButtonLink` only if they render identically. Do not create a second unrelated design system.

## 6. Wire the layout while keeping the temporary foundation specimen

- Add navigation and footer to the `(public)` site layout only; keep the future `(admin)` route group isolated so its dashboard can use shadcn later without inheriting the public shell.
- Keep the **Task 02 temporary specimen page** as the content at `/` for this task. Do not recreate the hero, homepage sections, About or Events yet. Leave its existing page-specific `noindex` metadata in place.
- Account for the source's overlaid homepage header vs padded internal pages using the documented offset CSS variables/layout rules; since `/` is currently a temporary specimen, any **temporary preview-only spacing needed to keep it visible** must be clearly isolated and documented. Do not alter header geometry to accommodate the specimen.
- Preserve the existing skip-to-main link, correct heading/landmark hierarchy and layout shift control. Copy only media needed for nav/footer, not all source assets or new imagery.
- Do not introduce shadcn, auth, Prisma, databases, emails, icon/animation libraries or new backend functionality.

## 7. Token-conscious checks: actual layout and behavior matter

After implementation, run **once near the end**: `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check`. Re-run only failed checks after fixes. Do not install Playwright or run the legacy full PHP/JS suite solely for this task.

If the existing browser tooling works, inspect the **production build** at 390×844, 768×1024, 1024×768, 1280×900 and 1440×1000 (at least 390/768/1440). Specifically verify:

1. Exact nav/header expanded and compact heights, source logo sizes, border/blur, offsets, typography, utility/main link ordering and single desktop dropdown.
2. Mobile drawer: open/close, overlay, focus trap/restore, exclusive submenus, breakpoint reset, Escape and inactive/unreachable controls.
3. Footer: source order, column spans, spacing, icon masks, copy, form layout and no false newsletter success; external rel attributes and email/tel links.
4. Page content remains readable and no horizontal overflow or broken media requests. Check no-JS navigation fallback.
5. Capture actual screenshots of source-like nav/footer at the three principal widths, including mobile drawer open and desktop compact state. Store small evidence records under `docs/evidence/task-03/` if practical, with a manifest and viewport/browser metadata. **Do not claim source-to-target pixel parity without source screenshots.**
6. Record any mismatch in source copy, geometry, behavior, assets or links, including justified newsletter safety deviation. Don't "quietly fix" it.

Use small, focused interaction/browser checks; **no entire end-to-end suite**, Lighthouse score claims, or speculative performance assertions. Track destination JS/CSS/font transfers only if actually measured. Maintain public low-bandwidth discipline by sending the smallest client JS necessary.

## 8. Git, Vercel, progress and stop

- Work on branch `codex/task-03-public-shell` off the latest `main`. **Never push Task 03 directly to `main`.**
- Update `docs/PROGRESS.md` truthfully. P2 is only `In progress` or `In review` for the shared shell and **must not** be marked Done until the whole homepage matches the Laravel source. CORE-02 may remain In progress. Do not upgrade PUB-01/PERF-01 to Done.
- Record the exact commit, relevant checks, browser captures/paths, missing reference screens, known nonfunctional routes, any source parity exception, and **actual Vercel preview link/status only if verified**.
- Commit and push the new branch. Vercel will automatically deploy a preview in the owner's configured Git integration. **A PR is not required and must not be created automatically.** If the environment cannot read Vercel status, explain it and supply the branch link; the owner can obtain the deployment URL from their Vercel dashboard.
- **Do not merge. Do not proceed to homepage.** Stop and wait for the owner's visual review.
- Final report: branch/commit, changed files, source-to-target mapping, precise checks, screenshots, Vercel preview URL if verified (otherwise `unavailable`), deviations/blocked work, update to PROGRESS.md, and one suggested next **bounded** task for the real homepage hero.

### Acceptance for Task 03

A source-faithful navigation/footer surrounds the temporary foundation page; all original source labels, assets, links and at-rest text remain intact; mobile/desktop interactions and responsive layout work; no unapproved design or editorial changes; small tests/build pass; branch pushed for independent Vercel visual review. Remaining source-site screenshot gap must be explicit.

**This is not a request to creatively enhance the public site. Port the original faithfully, including its quirks.**
