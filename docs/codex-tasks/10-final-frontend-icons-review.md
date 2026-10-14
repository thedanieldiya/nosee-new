# Codex Task 10 — MingCute public icons and final existing-Laravel frontend review

**Milestone:** Last of ten existing-public-frontend migration tasks; application change = **owner-approved UI icon standardization only**, plus exhaustive independent full-site acceptance audit. **Not a public launch, new-pages task, admin build, or evidence cleanup.**  
**Destination:** `thedanieldiya/nosee-new`. Start `codex/task-10-icons-final-public-review` from current `main` containing merged [Task 09 PR #9](https://github.com/thedanieldiya/nosee-new/pull/9), merge commit `aad5980db0065879d2d0b45394f738935b5fe578`.  
**Read-only source:** `thedanieldiya/nosee` @ `9872c4ed12aa48835eab71065c69b468424adb4a`.  
**Rules:** Read `AGENTS.md`, targeted `docs/PRD.md`, `docs/FRONTEND-TRACKER.md`, affected `docs/PROGRESS.md` rows and `docs/admin-dashboard-trd.md` icon design contract. Don't consume large Task 01–09 raw artifacts unnecessarily.  
**Delivery:** Branch, commit, push, brief evidence, STOP; owner creates/merges PR, approves any future scope separately. Don't touch Laravel, production/Vercel configuration, admin/dashboard, CMS, membership, missing public routes or previously approved copy.

## 1. Explicit owner rule — icon colours must match adjacent text

The owner **approved MingCute as the only general-purpose UI icon library for BOTH existing public site and future shadcn admin** and now requires **all icon colours to match their relevant neighbouring text**.

- Install one verified compatible `@mingcute/react` release, lock its exact version through npm lockfile; use its **real public exports** (modern package generally uses `@mingcute/react/core-regular` or `core-filled`; verify locally, don't guess component names or copy legacy examples). Avoid another icon library, an icon-font download or custom CSS/SVG icon invention. Use tree-shaken imports; don't turn shared server-only layout into client components.
- **Colour parity is mandatory:** Use the icon component's default `color="currentColor"` (or equivalent inherited CSS) so each decorative UI icon renders in **the same computed colour** as the adjacent link/button/label text in normal, hover, keyboard focus, selected/active, disabled and dark/light states. Icon-only links/buttons inherit their **own control's** foreground colour. Don't give icons separate `text-*` classes, hardcoded paints, filters (`brightness`/`invert`), masks or independent opacity that make them diverge from text. If the parent already changes colour on hover or focus, the icon must change **with it automatically**.
- This applies especially to **white text on dark/green buttons**, green stroke-link CTAs, muted `text-secondary` location/details, newsletter/brand sections, desktop/mobile navigation, the dark footer/social links, events types, profile-carousel arrows, search icon, icon-only external links and the 404 shell. Never force all icons green or grey.
- If MingCute has no exact icon, choose **the closest actually existing MingCute glyph**; don't invent custom paths or import Lucide/Phosphor/Tabler. Maintain the original action's meaning and accessible name. Note substitutions in a **short** mapping table in evidence.
- Preserve visual sizes, box metrics, alignment, spacing, flex behaviour and neighbouring text line wrapping; use the fewest icons necessary (do not decorate headings, paragraphs or cards with extra symbols). Original NOSEE **logos**, photographs/scientific images, and editorial artwork aren't generic interface icons; retain them. For platform social glyphs, seek verified existing MingCute brand icons first and keep exact link URLs/accessible platform names.
- Decorative icons next to readable action text must be hidden from assistive tech; icon-only controls retain accessible names. No double screen-reader announcements. Preserve reduced-motion, keyboard/focus and meaningful hover affordances.

**Verification is not optional:** For representative icon/text pairs, record computed `getComputedStyle(icon).color` and neighbouring label/parent-control `.color` across rest/hover/focus/active/disabled (where those states exist), including dark footer, white button, navigation and muted secondary text. Compare real SVG painted geometry where applicable; test descendants that might have explicit fill/stroke overrides. **Any colour mismatch is a failure**, not a known exception.

## 2. Audit all existing public UI-icon locations before editing

Inventory by a *targeted* source search for `/media/icons/`, `<svg`, CSS masks, `brightness`/`invert`, hand-drawn/CSS glyphs and icon-related components; don't read unrelated historical evidence. Known targets from merged main include:
- `src/components/site/ui/ArrowRight.tsx`, buttons and CTA call sites.
- `src/components/site/layout/SiteNavigation.tsx` and associated controller hooks: person/account icon, open/close hamburger, submenu chevrons, desktop/mobile controls. Keep existing `data-mobile-menu-open-icon`/`data-mobile-menu-close-icon` hooks and original working JS states.
- `SiteFooter.tsx`: social icon masks/hover/focus treatment, text+icon pairings; preserve icon-only aria labels and exact links.
- `src/components/site/events/{ListingEventCard,FeaturedEvent,EventDetail}.tsx`: source calendar/clock/map pin/up-right/right arrows; `src/app/(public)/events/page.tsx` search icon; archives and event month/group controls.
- `src/components/site/{about/ProfileCarousel,about/AboutPageContent,cards/*,sections/*}` for arrows, links and controls (replace where actually present).
- `public/media/icons/*.svg` asset references. **Remove obsolete tracked UI-icon asset files only once all actual source references are replaced**; don't delete unrelated official artwork/logo files or change content images.
- Admin isn't implemented: **don't install or generate shadcn/admin in this task**. Its future controls must use the same MingCute/currentColor rules already recorded in the approved TRD.

Port the **existing icons only**, not text/section layouts. The old original SVG paths will have **intentionally different shapes**; that's an approved post-port exception to source pixel parity, *not* an excuse to change brand typography, geometry, page copy, spacing or behaviour.

## 3. Whole-frontend final acceptance matrix (execute thoroughly)

**All original implemented routes:** `/`, `/about`, `/events`, `/events/archive`, all valid `/events/{slug}` regular details, the meeting **HTTP 302** redirect (original exact Location) and original 404/missing routes. Check source search `?q` semantics, date-based event listing/archiving and detail deadlines/itineraries, mobile navigation, hero and leadership carousels, monitoring cards, DOI/news/event links, footer/newsletter and all native actions. Exercise query/time boundaries at controlled real server instants. Don't fabricate newsletter success or phantom destination pages.

**Visual/responsive:** Compare pinned isolated Laravel and finished Next production at 390, 768, 1024, 1280, 1440px and relevant interactive states. **Two comparison axes** must be kept separate:
1. Source-vs-Next after icon migration: source content/layout/text/geometry/behaviours must still match; **report icon geometry as an explicitly authorised visual delta**. Don't report zero pixel difference when glyphs changed. Inspect unexpected RGB pixel differences outside verified icon bounds, not hide them with broad masks.
2. Last merged Next (`main` before Task 10) vs after: validate that **only approved icon assets/shapes/paint** differ and no layout, URLs, visible words, control states, accessible names or interactions drifted.

Use browser-computed colour/geometry checks at representative text+icon states, especially **light/dark, muted, inverted/brand button, hover, focus and disabled**. Visual geometry must stay aligned (size, baseline and spacing); if replacement changes line breaks, fix the icon wrapper, not surrounding content.

**Accessibility:** Check real keyboard order/activation, focus visibility, alt/labels, no duplicate icon announcements, contrast (including dynamically matched foreground icon colour), reduced-motion variants, no unexpected horizontal overflow, and meaningful SSR/JS-off behavior where source supported it. Preserve and report pre-existing **source no-JS mobile menu defects** as unresolved owner decisions. Don't quietly repair unrelated navigation behaviour.

**Performance/SEO/release:** Measure mobile and desktop image bodies, public JS/CSS payload and any increase from MingCute; inspect low-bandwidth startup and fonts, ideally Lighthouse/CWV with clearly stated test environment. **Existing homepage cold image ~3,938,451 bytes** is a known budget issue; diagnose and recommend low-risk changes, but **do not silently change original image formats/loading, hero behaviour, content, or caching policy** in this audit PR. Verify actual `robots`/noindex remains in place for unapproved fixture pages; avoid unsupported production-readiness claims. Source fixtures, unimplemented linked routes `/news`, `/publications`, `/data`, historical AGM 404, default 404 and URL redirects remain separately documented. The deliberate Laravel uppercase slug 500 → Next 404 difference remains disclosed, not silently “fixed” to a 500. Vercel domain and branch preview only if demonstrably reachable.

**Required automated checks:** all existing focused Node tests; TypeScript typecheck, lint, `npm run build`, `git diff --check`, production HTTP/status/redirect checks, and targeted icon import/colour/a11y assertions. Full QA execution and five-width screenshots are required; successful test/build alone is **not** source/UI acceptance. Fix only regression from icon migration; unrelated findings go to an ordered, owner-approved follow-up list.

## 4. Token-efficient evidence and review gate

- Run all necessary comparisons but keep huge screenshot matrices, raw browser dumps and complete PHP-oracle JSON **out of Git and model context**. Commit a compact `docs/evidence/task-10/README.md` (prefer ≤120 lines), a small icon mapping/colour-state table, reproducible test instructions and at most **4–6 representative source/target pairs**. Additional full matrices may remain ephemeral/CI artifacts. No giant generated files.
- Update `docs/PROGRESS.md` and `docs/FRONTEND-TRACKER.md` accurately: [Task 09 PR #9 merged](https://github.com/thedanieldiya/nosee-new/pull/9); Task 10 **In review** only after finished audit and clean checks; **never mark all phases Done or approve indexing/production on the owner's behalf**. Report blocker severity, proposed corrective actions and whether each requires owner permission.
- **Do not remove historical evidence yet.** Once the owner has reviewed/accepted the final existing-route port and icon work, a **separate owner-authorised cleanup PR** will delete **all** tracked migration evidence (temporary scripts/logs/screenshots/reports under `docs/evidence/`) while preserving essential tests, code and concise evergreen docs; no history rewriting.
- Leave the Admin Dashboard TRD and its Next.js IA unchanged except for already approved MingCute/currentColor policy. No shadcn installation or admin implementation in Task 10.
- Commit and push `codex/task-10-icons-final-public-review`. **No automatic PR or merge, no production deployment modifications. STOP for owner review.**

### Acceptance

All original source public routes and approved frontend interactions still work, including SSR/status/date rules, and updated interface icons use only **real MingCute exports** with colour **equal to their neighbouring text in every tested state**. Any intentional glyph-shape changes are transparently enumerated; non-icon visual/layout/functional regressions are absent or reported with precise blockers. Full tests/visual/performance/a11y verification is executed, evidence is concise, and only the owner can approve final frontend signoff and subsequent evidence deletion.
