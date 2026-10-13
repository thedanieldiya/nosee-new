# Codex Task 01 — Laravel discovery and Next.js migration baseline

**Task:** `P0` from [the new PRD](../PRD.md).  
**Progress ledger:** [PROGRESS.md](../PROGRESS.md).  
**Mode:** Read legacy code; write **documentation only** in destination.  
**Do not** scaffold Next.js, install packages, design a new UI, migrate PHP, implement admin features, change the legacy source, or run full test suites.

## Ready-to-paste Codex Cloud instruction

You are working on the NOSEE near pixel-perfect Laravel-to-Next.js migration.

**Writable destination repository:** `thedanieldiya/nosee-new`  
**Legacy reference, read-only:** `thedanieldiya/nosee`  
**Legacy reference revision:** `9872c4ed12aa48835eab71065c69b468424adb4a` (if still available; record actual inspected revision if different).

**Read these before any edits:**

1. `AGENTS.md` and the relevant `.agents/skills/` instructions (especially Ponytail, frontend developer, backend architect, and codebase discovery/review guidance if available).
2. `docs/PRD.md` — canonical product requirements and acceptance gates.
3. `docs/PROGRESS.md` — the canonical evidence-based progress ledger.
4. The legacy repository's `README.md`, `docs/PRD.md`, routes, controllers, content, views, CSS/JS, data validation and tests.

If the workspace is attached to the **legacy repository rather than `nosee-new`**, stop and report that the destination is wrong. If the legacy repository is not accessible, do not guess; update `docs/PROGRESS.md` with the real blocker and stop. You may obtain a separate read-only checkout of the public legacy repo if the environment permits it; never write or open a PR against the legacy source.

### Goal

Prepare a rigorous, concise, code-grounded baseline so later Codex tasks can convert the actual website to Next.js in **small reviewable chunks**, preserve responsive visuals and behavior, and progressively implement the admin/CMS functionality without confusing existing features with planned features.

**Priority order:** correctness and privacy → existing public-site fidelity → accessibility → low-bandwidth performance → maintainable Next.js structure → incremental feature addition.

### Step 1 — Baseline repository audit (read-only)

Enumerate **actually implemented** routes and separate them from:

- implemented Blade pages and components not routed publicly;
- structured content records without a page;
- unimplemented sections mentioned in the old Laravel PRD;
- placeholder and development-fixture copy needing owner approval.

Read the real implementations (not just filenames):

- `routes/web.php` and the relevant controllers.
- `resources/views/layouts/`, `resources/views/pages/`, `resources/views/about/`, `resources/views/events/` and shared `resources/views/components/`.
- `resources/css/app.css` and responsive Tailwind classes used on pages.
- `resources/js/` for mobile navigation, hero, profile carousel, animations, newsletter, and other interactive behaviors.
- `app/Services/`, `app/Repositories/`, `app/Contracts/` and `content/`; trace content selection, dates, grouping, validation and links.
- `public/media/` and bundled font dependencies; note which image variants and font weights currently exist.
- Relevant unit/feature/browser logic tests, to understand the expected behavior without running them.

Call out event state logic, search, ordering, archived events, meeting redirects, any newsletter limitations, responsive copy differences, use of `NSEE` versus `NOSEE`, and specifically flagged development fixtures.

### Step 2 — Create `docs/migration-map.md`

Include the following with **source file path → proposed Next.js path/component** mapping:

1. A concise source architecture and request/data-flow map.
2. Route inventory with classification: `implemented` / `partial` / `planned`. Do not infer routes merely from navigation links.
3. All homepage sections, the About page, event listing/archive/detail layouts, reusable UI primitives, interactions and assets.
4. A recommended idiomatic `src/` + App Router structure including separate public/admin route groups, `src/components/site` and `src/components/ui` (shadcn admin primitives), shared tokens, typed content boundaries, and backend folders **as needs emerge**. Avoid speculative architecture.
5. A data translation table for structured legacy PHP content into typed TypeScript/JSON and eventually database-backed editorial records. Maintain slugs, time zones, content ordering, featured rules, source attribution and references.
6. Clear separation of **parity migration** vs **new public pages** vs **new admin/member functionality**; state risks and unresolved data/UX questions.
7. A small recommended milestone-by-milestone sequence consistent with `docs/PRD.md`, including the first next implementation task (P1).
8. A compact "what not to change" section: URLs, copy, fonts, responsive sizes, navigation semantics, imagery, assets and existing behavior without a documented decision.

**Never claim that the public admin, membership, newsletter persistence, or content publishing exists in Laravel if it does not.** Do not invent database entities that are currently only proposals.

### Step 3 — Create `docs/visual-baseline.md`

Capture the exact existing:

- Color tokens and their intended usages, including brand green `#13853d` and accent blue `#1e4ec4`.
- Font families (Ubuntu Sans/IBM Plex Sans), used weights, sizes and line-height patterns.
- Containers, grid systems, spacing rules, card styles, borders, breakpoints, image crops/aspect ratios, mobile/tablet variants.
- Nav/dropdown/menu, hero carousel, profile carousel, hover/focus, animation and reduced-motion behavior.
- Baseline public screenshots at representative viewport widths **390px, 768px, and 1440px** for homepage, About, Events and relevant archive/detail states, **if browser tooling and a reachable environment are available**.

Use actual source and screenshots as evidence. If screenshots or live site are unavailable, write a per-page `Not captured` entry and the exact reproduction steps. Do not fabricate image links or assert pixel parity. Note meaningful conflicts between old PRD prose, source code and live behavior (including possible hero autoplay discrepancies) for owner decision.

Extract **proposed** shared React component mapping, but do not write React components during Task 01. For the future admin UI, describe how shadcn tokens can align with NOSEE's palette/fonts without pushing dashboard dependencies into public JS.

Define a lightweight, measurable visual parity and low-bandwidth acceptance checklist. Do not assert unmeasured Lighthouse or Core Web Vitals scores; explain how later implementation tasks should measure them.

### Step 4 — Update progress truthfully

Update `docs/PROGRESS.md` in the same branch:

- Mark `P0` as `In review` only if both requested audit documents have sufficient evidence; otherwise `Blocked` with reasons.
- Append an actual-date Task 01 entry with document links, what was inspected, what was skipped and unresolved decisions.
- Do **not** mark implementation requirements (CORE-01 through QA-01) or any implementation phase as Done. There is still no Next.js implementation.
- Treat screenshots and owner signoff as gates; P0 becomes `Done` only after owner review and required evidence.

Do not change `docs/PRD.md` to make an incomplete capability pass. If an acceptance criterion needs revision, propose it in your task summary.

### Step 5 — Checks and stop

Only perform the necessary inexpensive checks: review created Markdown for broken relative links, references, clear headings and duplication; `git diff --check` if shell is available. There is **no application to build or test** in this discovery task. No package install, whole-repository test suite, Playwright installation, Lighthouse execution, or broad code refactor.

Produce documentation and progress edits on a **dedicated branch** and open a reviewable PR to `main` if the environment supports it. Do not modify the Laravel repo. If a PR cannot be opened, provide the exact commits/paths and explain why.

**Final response must give:** inspected legacy commit; files created; route/component inventory summary; screenshots captured/missing; confirmed source-vs-PRD discrepancies; unresolved blockers; P0 progress status; and **one** recommended bounded Task 02. Then STOP and wait for owner review.

---

**Acceptance:** Task 01 is delivered when the source-grounded `migration-map.md` and `visual-baseline.md` plus updated `PROGRESS.md` are present in a reviewable change, with gaps explicitly marked. It does not have permission to build the actual Next.js website.
