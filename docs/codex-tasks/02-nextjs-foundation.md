# Codex Task 02 — P1 Next.js foundation and public design-system primitives

**Scope:** P1, foundation only, as defined in [PRD](../PRD.md) and [PROGRESS](../PROGRESS.md).  
**Writable repository:** `thedanieldiya/nosee-new`, **branch off updated `main`** (Task 01 PR #1 is merged).  
**Legacy source (read-only):** `thedanieldiya/nosee` at `9872c4ed12aa48835eab71065c69b468424adb4a`.  
**Owner-provided Vercel domain:** https://nosee-new.vercel.app (production-branch domain; a PR normally receives a **different preview URL**).  
**Proposed task branch:** `codex/task-02-nextjs-foundation`.  
**Deliverable:** A runnable, deployable Next.js project with NOSEE tokens/fonts, three public UI primitives, and a **clearly temporary** component-preview page. **No homepage or backend migration yet.**

## Ready-to-run instruction for Codex Cloud

You are implementing **Task 02 (P1)** of NOSEE's near pixel-perfect Laravel-to-Next.js migration. The owner has merged the Task 01 discovery PR and configured Vercel at `nosee-new.vercel.app`. Your task is to create the actual Next.js foundation, **not** to rebuild the entire public site.

### 0. Read and verify before editing

Read:
- `AGENTS.md` and the relevant local Ponytail and Agency frontend/performance guidance from `.agents/skills/`.
- `docs/PRD.md`, `docs/PROGRESS.md`, `docs/migration-map.md`, `docs/visual-baseline.md`.
- The original Laravel `resources/css/app.css`, `resources/views/layouts/app.blade.php` and exactly these Blade primitives:
  - `resources/views/components/ui/container.blade.php`
  - `resources/views/components/ui/button.blade.php`
  - `resources/views/components/ui/arrow-right.blade.php`
  - `public/media/icons/arrow-right.svg`.
- Confirm the actual destination repository is `thedanieldiya/nosee-new` and `main` contains the merged P0 documents. Create a fresh topic branch from latest `main`.

**If the legacy files cannot be read, consult the source-grounded Task 01 documents; explicitly report any assumptions. Do not alter the legacy repo.** If destination differs or the source-grounded visual facts are unavailable, stop rather than substitute a fresh template design.

### 1. Scaffold Next.js correctly, at repository root

Create a **minimal, stable-version-compatible** Next.js App Router application using:
- Next.js + React at mutually compatible **stable** versions available in the Codex environment. Check current published compatibility and the runtime/Vercel Node requirements; document actual installed versions. **Do not blindly choose prereleases.**
- TypeScript with `strict` checking, `src/` directory, App Router route groups, ESLint, Tailwind CSS **v4** using its supported PostCSS integration.
- npm and one committed `package-lock.json` unless an existing compatible lockfile requires otherwise.
- A simple, functional `npm run dev`, `npm run build`, `npm run start`, `npm run lint` (ESLint CLI, not obsolete `next lint`) and `npm run typecheck`.
- Sensible `.gitignore` for `node_modules`, `.next`, generated output and local `.env*` files; preserve any committed `.env.example` templates.
- An explicit compatible Node.js engine/version policy if required for Vercel, documented in README; don't introduce Node version incompatibility in Codex vs Vercel.
- `next.config.ts` only if needed. **Do not use `output: 'export'`**; later releases need server-side admin, DB and email features.

**Nonempty repository warning:** It already contains `.agents/`, `AGENTS.md`, `docs/` and `README.md`. Scaffold **in place without overwriting, nesting, deleting or discarding** those files. If the Next.js generator refuses a nonempty target, generate in a temporary location and copy only the required source/config files into the existing repository. Inspect its defaults; remove unused starter logos and sample assets.

Use **no** database, Prisma, Auth.js, Resend, shadcn, component kits, icon packs, animation libraries, analytics, monitoring scripts or CMS packages in this task. Do not create speculative folders for them.

### 2. Preserve the actual public design system

Implement source-faithful shared tokens, not generic Tailwind/shadcn defaults.

Reference `resources/css/app.css` in the pinned Laravel repository and `docs/visual-baseline.md`:
- Brand `#13853d`; accent `#1e4ec4`.
- Primary text `#171717`; secondary `#5c5c5c`; tertiary `#a3a3a3`; disabled `#d1d1d1`.
- Inverse/default white `#ffffff`; surface `#f7f7f7`; line-soft/mild/strong equivalent to black at 5/10/20% alpha.
- Ubuntu Sans for headings; IBM Plex Sans for body. Use local/self-hosted font resources, with only necessary Latin subsets/weights. Reusing the **existing `@fontsource` families** is appropriate; avoid build-time dependence on downloading Google fonts. Preserve weight/italic behavior and `font-display: swap`. Do not add the unused Instrument Sans as a new font download.
- Preserve the legacy Tailwind `sm/md/lg/xl` breakpoint behavior: 640/768/1024/1280 CSS px at the default 16px root.
- Put semantic design tokens in `src/styles/tokens.css` (or a single clearly documented equivalent) and wire them into `src/app/globals.css`/Tailwind v4. Avoid duplicate/conflicting variables. Keep source color names such as `brand`, `accent`, `primary`, `surface` and `line-mild` functioning as expected.
- Establish accessible base body, heading, link and focus styling without importing a stock Next.js demo theme or changing the original visual proportions.

Record any justified small differences, such as font-loading technique, in the PR summary. Do not proclaim pixel parity: baseline screenshots are still missing.

### 3. Implement **only** these public primitives

Create as minimal **server components** (no `"use client"` directive):

1. `src/components/site/ui/Container.tsx` — same semantic layout as the original: `mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8 xl:px-16`. Supports normal `children` and optional className; preserve the original structure and do not invent multiple container variants.
2. `src/components/site/ui/ButtonLink.tsx` — accessible anchor-style action preserving source `sm/base/lg` sizes (36/44/48px), 2px radius, primary/secondary/destructive `fill/stroke/text` styling, accent focus outline, hover/active treatment, and correct disabled-link semantics (no href, `aria-disabled`, not tabbable). Keep types narrow and understandable. The source's native `button` behavior may be added only if needed to implement the primitive cleanly; do not build a component framework or import shadcn.
3. `src/components/site/ui/ArrowRight.tsx` — 16px decorative current-color arrow using the original `/media/icons/arrow-right.svg` mask or an equivalent faithful rendering. Copy the exact small SVG asset from the legacy repository. It must be `aria-hidden` when purely decorative.

Do not create public headers, dropdowns, footers, carousel, article cards, event widgets, admin UI, or CMS forms here. They will be separate reviewed tasks.

### 4. Minimal running shell and foundation preview

Create only the route/layout files genuinely required to build a runnable app:
- `src/app/layout.tsx` — proper `html lang="en"`, body, fonts and essential accessibility/global styles. Include a skip-to-content link targeting the main region if a matching target is rendered.
- `src/app/(public)/layout.tsx` if required for an idiomatic public route group; use `<main id="main-content">` and avoid premature duplicated layouts.
- `src/app/(public)/page.tsx` — a small, server-rendered **"NOSEE — Foundation Preview"** specimen page using Container, ButtonLink and ArrowRight. Show the heading/body fonts, brand/accent/neutral colors and the representative buttons at different sizes/variants. It is a temporary review aid **not the real homepage**. Label it accordingly and use page-specific `robots: { index: false, follow: false }` metadata so the temporary specimen is not indexed. Do **not** apply `noindex` to the entire future site.
- Ensure the page has a meaningful heading, readable accessible markup, clear focus styling, and no empty/broken links. Representative specimen controls can link to in-page anchors. It must render without client-side JavaScript.
- Do not try to match the actual homepage in this task or add fictional research/news content. In particular, leave actual public navigation/footer for the next task.

The Vercel PR preview should display this temporary foundation page when the branch deploy succeeds. It is acceptable—and required—to replace it with the actual homepage in P2.

### 5. Low-bandwidth discipline

- Keep shared public components and the specimen server-rendered; `"use client"` should not be necessary in this phase.
- Do not add Framer Motion/Motion, Lucide, analytics, shadcn, an image framework, charting, email, auth or database dependencies.
- Prefer native HTML/CSS and compile-time Tailwind utilities; no unnecessary custom JavaScript or remote fonts.
- Minimize CSS/font imports while retaining necessary visual parity. Do not preload every font face.
- Report installed direct dependencies and any unexpected bundle/runtime size concern. No full benchmarking/Lighthouse suite is needed now.

### 6. Minimal checks and required Vercel preview

Perform **once near the end**, not in a loop after every file:
1. `npm ci` (or the selected package manager's clean equivalent) to prove the lockfile is usable.
2. `npm run typecheck`.
3. `npm run lint`.
4. `npm run build` (one production build is required to catch Vercel failures).
5. `git diff --check`.
6. If available without extra installs, run a lightweight HTTP smoke check for `/` and inspect the generated HTML. Do **not** run a broad/full E2E suite or install Playwright solely for P1.

Review the page at **390px, 768px, and 1440px** if browser tooling works. Verify expected container gutters, typography, colors, button heights/variants, focus and no horizontal overflow. If screenshots are possible, attach them to the PR or link actual artifacts; otherwise mark `Not captured` with a reason. Do not invent visuals or Core Web Vitals scores.

**Vercel:** The owner has connected the repo to Vercel and configured https://nosee-new.vercel.app. Once the task branch is pushed and a PR exists, identify its **branch-specific Vercel Preview Deployment URL** from the PR/checks if available, confirm deployment status if accessible, and include that URL in the handoff. **Do not confuse** the production-branch domain with the PR preview or silently push unfinished work to production. If Vercel does not provide a preview, say so and record the actual failure; don't claim a working link. No changes to Vercel domain settings or secrets are authorized.

### 7. Progress, PR and stop

- Update `docs/PROGRESS.md` on the task branch: mark **P1 In progress** during work; after successful scoped checks mark **P1 In review**, not Done until the owner inspects the Vercel preview. Update CORE-01/CORE-02 only to the level justified by evidence (full content design system is not finished with three primitives). Do not mark PUB-01 or performance targets Done.
- PR #1 has been merged. Its docs are approved for migration planning; the **absence of original Laravel reference screenshots and unresolved visual decisions still remains a blocker to public-page parity**. Note that P0's visual evidence remains outstanding; do not rewrite history or manufacture captures.
- Add a dated Task 02 history entry with commit/PR link, checks actually executed, deployment preview URL/status, and remaining blockers.
- Commit on `codex/task-02-nextjs-foundation`, push and open a PR against `main`. If Codex Cloud cannot create the PR via the GitHub API, push the branch and provide a browser URL: `https://github.com/thedanieldiya/nosee-new/pull/new/codex/task-02-nextjs-foundation`. Never merge automatically.
- Final response must include: changed files, installed package versions, which source tokens/components were ported, typecheck/lint/build results, screenshot availability, actual preview URL if known, PROGRESS.md status, and **one** recommended next task for the real public shell/homepage.
- **STOP and wait for owner visual approval.**

## Explicit exclusions for Task 02

No production homepage reconstruction, public navigation/footer, About or Events page, typed migration of 40 content files, test suite expansion, copied huge image library, shadcn/admin scaffolding, Prisma/database/auth, membership application, newsletter implementation or deployment of the unfinished site to `nosee.org`.

## Acceptance gate

Task 02 is **In review** when a buildable, deployable App Router app exists with accurate tokens, preserved fonts, the three specified components, a clearly temporary server-rendered preview page, minimal checks passed, and a reviewable branch/PR. **Done** requires owner acceptance of the foundation page and the agreed preview workflow. Public-site visual parity is explicitly **not** achieved in Task 02.
