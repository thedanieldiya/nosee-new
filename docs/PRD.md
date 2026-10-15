# NOSEE — Next.js Migration and Administration PRD

**Version:** 1.2 · **Updated:** 14 October 2026 · **Status:** Original public migration complete as a development milestone; release and full-stack requirements remain active
**Product:** Network of Space–Earth Environmentalists (NOSEE) website  
**Delivery:** Codex Cloud, in small reviewable tasks  
**Destination:** https://github.com/thedanieldiya/nosee-new  
**Legacy source (read-only):** https://github.com/thedanieldiya/nosee  
**Legacy reference revision at PRD creation:** `9872c4ed12aa48835eab71065c69b468424adb4a` (main)  
**Progress record:** [PROGRESS.md](PROGRESS.md)  
**Development/release baseline:** [PUBLIC-SITE-STATUS.md](PUBLIC-SITE-STATUS.md)
**Legacy product scope reference:** [Laravel PRD](https://github.com/thedanieldiya/nosee/blob/main/docs/PRD.md)

> This document is the product and acceptance-criteria source of truth for the Next.js project. It supersedes the legacy Laravel PRD **for the new implementation**; the legacy PRD remains useful as the original public-site feature inventory. Implemented legacy behavior and actual visuals must be audited separately from older aspirational requirements. Do not equate "present in an old PRD" with "currently implemented."

## 1. Problem, outcome, and non-negotiables

The public NOSEE website is presently built using Laravel, Blade, Tailwind CSS, lightweight vanilla JavaScript, and structured PHP content files. Maintaining and expanding the site in that stack is less convenient for the owner, whose usual stack is Next.js. The desired outcome is **one maintainable, full-stack Next.js application** serving both the original public experience and a new, authenticated administrative interface.

Success is **not** achieved by a simple framework swap. It requires:

1. Near-identical appearance and correct behavior of existing public pages at matching viewports, with no unapproved redesign or content changes.
2. A coherent public-site design system extracted from existing implementation tokens and components, not an unrelated premade theme.
3. Extremely light public pages that remain readable and usable on low-end mobile devices and unreliable, slow networks.
4. A protected, shadcn/ui-based admin dashboard themed to match NOSEE's typography and brand palette.
5. Working membership applications, review decisions, controlled public people profiles, editorial publishing, and transactional email.
6. Safe migrations, validated content, accessible interfaces, clear progress evidence, and code that the owner can maintain.

**Do not:** change the legacy repository; rebuild everything in one unchecked task; silently redesign the public site; turn public applicants into user accounts; expose applicants' private details; assume development fixtures are approved organisational information.

### Owner decision (13 October 2026): strict 1:1 public-site replica

For the **existing Laravel public website**, the migration is a **literal, one-to-one technical port**, not a design exercise. Treat the actual Laravel **implementation** as authoritative for visible UI and behavior. Preserve original **layout geometry, exact text/copy, spelling and typos, visual hierarchy, section/card order, source content records (including clearly identified fixtures), assets, images/crops, colors, fonts/weights, dimensions, breakpoints, responsive text variants, links/URLs, controls and interactions**. Do **not** exercise creative liberty or silently "improve" or normalize any public-facing details. In particular, **do not automatically fix source `NSEE` versus `NOSEE` labels or source placeholder URLs/biographies** during parity tasks. Record these as proposed content corrections requiring separate explicit owner approval. Preserving a fixture in a preview does not mean it is verified material or approved for public publication.

Use the implemented Laravel version as the technical source of truth when an older PRD, sketch, or test assertion conflicts with it, unless the owner explicitly selects a different version. Once reference screenshots can be obtained, compare the actual rendered source and Next.js output at equal viewports; **do not claim pixel parity when reference images are missing**. For functionality never actually implemented in Laravel, plan and review it as **new scope**, not a 1:1 migration.

**Owner-authorised post-port icon exception (14 October 2026):** After the original public Laravel routes have been ported (Task 09 merged), migrate the public website's **general-purpose interface icons** to MingCute, consistently with the [approved admin dashboard TRD](admin-dashboard-trd.md). Preserve all non-icon geometry, content, interactions and visual treatment. MingCute icons **must inherit adjacent text colour through `currentColor`**, including hover, focus, selected, disabled and dark-surface states; if there is no exact MingCute glyph, select the nearest official MingCute glyph instead of inventing one. Do not call intentional icon-shape differences “pixel identical” to Laravel. Document a small icon-only visual exception and test untouched surrounding regions separately. This does not authorise redesign or functional changes.

**Narrow correctness/safety exception:** Do not recreate behavior that falsely claims a successful external action or leaks data. The existing newsletter endpoint logs rather than subscribing visitors. Preserve its **at-rest appearance, text and structure exactly** until real integration is approved, but do not send a false success confirmation. Document any unavoidable accessibility/security/operational deviation and obtain owner approval; do not use this exception as permission for a visual redesign.

**Delivery workflow:** Codex completes one bounded task on a separate branch, pushes it to GitHub so Vercel can generate a **branch preview**, and stops for owner review. **Creating a PR is optional and is not a required Codex step.** Never merge or push unfinished code to `main` without the owner's decision.

## 2. Audiences and principal journeys

| Audience | Core journey |
| --- | --- |
| Public visitors | Read about NOSEE, browse research and publications, view current news and events, follow monitoring sources, make contact or support the organisation |
| Prospective members | Complete a registration/application form, receive a submission acknowledgement, later receive approval or rejection by email |
| Administrators | Sign in to `/admin`, review member applications, manage members and chosen public profiles, maintain news/events/site content and monitoring resource information |
| Editors (optional later) | Draft and publish assigned types of content under restricted permissions; introduce only if the owner confirms a need |

Membership application **does not** grant dashboard access. Approval also does **not** automatically expose the member on a public directory.

## 3. Grounded pinned legacy baseline

### 3.1 Currently routed in `routes/web.php`

- `GET /` — homepage (`HomeController`).
- `GET /about` — About page (`AboutController`).
- `GET /events` — event listing and search (`EventController@index`).
- `GET /events/archive` — historical events.
- `GET /events/{slug}` — individual event; `meeting` event types redirect to `meeting_site_url`.
- `POST /newsletter/subscribe` — validates and logs an address in the development implementation; **does not store subscribers or send mail**.

Do not mistake the many links to currently unimplemented sections for existing routes. The source PRD also describes research, data, products, meetings, publications, outreach, news, support, contact, and legal pages that may exist only as content models, folders, placeholders, or plans.

### 3.2 Visible homepage sections and assets

Current Blade composition: hero → monitoring dashboards → research outputs → trending news → upcoming events, within shared navigation and footer. Underlying templates are in `resources/views/`; reusable sections/cards are under `resources/views/components/`. Static media is under `public/media/`.

Relevant browser interactions are implemented in small `resources/js/` modules: mobile navigation and dropdowns, navigation state, hero carousel, profile carousel, homepage motion, and newsletter feedback. Preserve behavior where practical, including focus handling and reduced-motion support. Audit discrepancies between source code, the live site, and legacy PRD before changing behavior (the legacy PRD's "no hero autoplay" guidance differs from the current carousel implementation).

### 3.3 Existing content model

Structured `content/*.php` files define site settings, navigation, homepage, About, research areas, data records, products, publications, news, events, and outreach. Service/repository classes select, validate, sort, and present these records. Preserve selection and ordering behavior, including upcoming event calculations with explicit time zones, archive grouping, featured news/meeting rules, research-output ordering, and external scientific source attribution.

Some source records and About/leadership content explicitly say **development fixture/placeholder**; some site/navigation copy uses `NSEE` while the intended brand is `NOSEE`. Treat these as content-review flags, not confirmed real-world facts. No placeholder may be published as verified organisational material without review.

## 4. Scope and sequencing

### A. Parity migration — first release candidate

- Next.js App Router + TypeScript + Tailwind CSS 4.
- Public shared layout, public design tokens, brand typography and existing responsive behavior.
- Existing implemented homepage, About and Events routes.
- Existing static images/icons, content records and core homepage content-selection behavior.
- SEO metadata, accessible and fast loading, safe error/404 handling.
- A temporary **typed file-backed** content adapter is acceptable for the parity phase; do not make database setup a prerequisite for replicating the public pages.
- **No new admin features** until the public parity gate passes.

### B. Public scope completion — after parity

- Working public listing/detail or informational pages, in product priority order: News, Research/research areas, Publications, Data, Products, Outreach, Meetings, People (published executives/researchers), Join, Contact, Support, Multimedia (if content exists), and approved Privacy/Terms.
- Preserve legacy paths when meaningful; distinguish new page designs (no previous visual baseline) from ported page designs (strict visual parity).
- Keep Data and Products conceptually separate even where the existing navigation groups them.
- Do not manufacture scientific results, leadership biographies, news, legal terms, partners, donation arrangements, or meeting/event details.

### C. Full-stack admin and content management — after the public foundation

**Approved admin information architecture:** [NOSEE Admin Dashboard — TRD v1.2](admin-dashboard-trd.md) (updated by owner 14 October 2026). This specification controls the admin route tree, three access roles, exact Site content destinations, research membership flows, **DOI-first editable publication imports, automatic homepage content rules and Gallery photo/album workflows**. It overrides the older preliminary navigation/editing proposals. Admin implementation remains separate from the completed public route port.

- Admin authentication and scoped role checks for `super_admin`, `editor` and `research_group_lead`.
- Membership application storage, review, approval/rejection and transactional notifications; private Member records remain independent of published leadership PublicProfile records.
- Publishing editors for News, Events and Publications; the Publication editor starts with **DOI**, retrieves citation metadata from a trusted provider, and leaves imported fields editable for corrections/manual fallback.
- Homepage: **edit Hero slides only**; published/featured Events and News and the **three newest published Research Outputs** populate automatically from their content records. Do not build manual homepage collection selectors.
- Website → Site content: **Homepage, Leadership profiles, Gallery (standalone photo or album), Privacy policy**. Standalone photo caption is required and reused as alt text; album-photo captions are optional and names are autogenerated from album title and sequence.
- Website → Monitoring dashboards remains a **reserved empty admin page**; public Monitoring dashboards, About editorial copy, Contact, navigation/footer and shared site text stay **hardcoded/code-managed**. Do not implement editors for these.
- Contextual media uploads, validated records, previews/publishing status and audit history where appropriate. Settings contains own-account General, Super Admin Administrators and Activity log; there is **no Email delivery, Operations or global Media library navigation**.

### Explicitly out of scope unless separately approved

Applicant/member login portal, automatic account creation, private member dashboards, complex real-time space-weather data processing, custom scientific data pipelines, payment checkout, arbitrary page-builder functionality, broad integrations, multi-tenant administration, automated publication ingestion, comprehensive site-wide search, and redesigned public branding.

## 5. Public visual design system — requirements

**VIS-01 — Exact foundation.** Extract tokens from `resources/css/app.css`, including brand green `#13853d`, accent blue `#1e4ec4`, primary text `#171717`, secondary text `#5c5c5c`, surface `#f7f7f7` and current line/border semantics. Preserve Ubuntu Sans headings and IBM Plex Sans body type, actual weights, spacing, layout widths and breakpoints as implemented. Do not invent a new visual theme.

**VIS-02 — Correct component hierarchy.** Use public primitives for container, button/link, section heading, badge where already justified, forms and other genuinely reused patterns; compose these into navigation, hero, news, monitoring, research, event, footer and public profile components. Each public component is the React/TypeScript equivalent of a source visual or interaction pattern.

**VIS-03 — Pixel/interaction parity gate.** Capture the legacy and destination interfaces at the same approximately 390px, 768px and 1440px viewports, with identical state/content and fonts loaded. Compare layout, heights, spacing, alignment, typography, image crops, responsive behavior, focus/hover and mobile navigation. Attach screenshots or explicit evidence of what could not be checked. The reviewer decides whether remaining differences are acceptable.

**VIS-04 — Shared theme, distinct dashboard UI.** Use shadcn/ui only for admin/dashboard primitives, customized to NOSEE's brand tokens, Ubuntu Sans and IBM Plex Sans. Do not let admin UI dependencies become imports in public route modules or client bundles. Dashboard need not look like the public marketing pages, but must be cohesive.

**VIS-05 — Accessibility.** Target WCAG 2.2 AA practices, including semantics, keyboard-only navigation, reduced motion, visible focus, contrast, meaningful alt text, accessible dropdowns/dialogs, touch controls and well-labeled forms. Accessibility improvements that minimally alter styling may be accepted if documented.

## 6. Functional requirements and acceptance evidence

Requirement IDs are stable and referenced in [PROGRESS.md](PROGRESS.md). A requirement is "done" **only** when implementation evidence and its acceptance checks exist.

| ID | Requirement | Acceptance condition |
| --- | --- | --- |
| CORE-01 | Single full-stack Next.js App Router project | One deployable app contains isolated public and private admin route groups, no PHP/Laravel runtime dependency |
| CORE-02 | Source-faithful design system | Token inventory and mapping from actual Blade components, public components reuse tokens, visual review recorded |
| CORE-03 | Legacy content migration | Typed records preserve slugs, assets, ordering, associations, relative links and date/time zone logic; invalid records fail validation |
| PUB-01 | Homepage parity | Hero, monitoring, research, news, events, nav and footer match baseline layout/content/interaction |
| PUB-02 | About parity | Intro, mission, story, leadership placeholders, collaborations and responsive editorial layouts match baseline; placeholders flagged for approval |
| PUB-03 | Events parity | Upcoming/ongoing/archive, search, date formatting, external meeting redirect and event detail behavior preserved |
| PUB-04 | Other public pages | Planned sections have meaningful accessible working routes only as content/approvals allow; no fabricated content |
| PUB-05 | SEO, links, redirects | Metadata, sitemap, robots, canonical URLs, proper 404 and no broken critical public links |
| ADM-01 | Secure admin sign-in | Unauthorized users cannot access admin data/actions, even by direct API or server-action requests; safe sessions/log-out |
| ADM-02 | Admin layout & navigation | shadcn interface uses NOSEE theme; responsive nav, understandable information hierarchy and distinct private app boundary |
| MEM-01 | Membership application | Public form validates necessary details, displays clear acknowledgement, persists once, resists spam/duplicate submissions |
| MEM-02 | Admin application review | Admin can filter/view pending/approved/rejected applications; sees submitted details privately and can record decisions safely |
| MEM-03 | Applicant/admin emails | Submission acknowledges receipt to applicant, alerts admin; approval/rejection triggers correct email with clear status; send failures logged and retriable |
| MEM-04 | Private members & leadership profiles | Approved applicants become private member records; admin manages separately published Leadership profiles directly under Website → Site content, optionally linking matching identities without exposing private member details to Editors. |
| CMS-01 | News, events and DOI-first publications publishing | Validated create/edit/preview/publish; News and upcoming Events automatically feed homepage (featured first, then latest), and the latest three published publications feed Research Outputs. DOI import populates editable citation fields; no invented metadata. |
| CMS-02 | Limited Website content editing | Admin manages Homepage Hero, Leadership profiles, standalone Gallery photos and Albums, and Privacy policy, with controlled publication and cache revalidation. Monitoring dashboards admin is reserved/empty; public monitoring, About copy, Contact and Shared content stay code-owned. |
| CMS-03 | Media/record safety | Uploaded files type/size validated, media URLs safe, ownership clear, records/audit trail survive restarts/deploys |
| NWS-01 | Newsletter | Proper functional storage or approved provider, consent handling, duplication protection and honest success/failure messages; no pretend success |
| OPS-01 | Secure and maintainable operations | Secrets excluded from Git, environment sample, DB migrations, backups, restricted admin media, auditability, error logging, deployment and rollback documented |
| PERF-01 | Fast low-bandwidth delivery | Public route performance measured; Core Web Vitals and page-weight targets checked, slow-network usability demonstrated |
| QA-01 | Evidence-driven delivery | Every milestone has narrow checks, relevant screenshot comparisons and a progress update with commits/PR links and open issues |

### Membership state and email details

1. `pending` application is created server-side from validated input (no public account). Send applicant a **receipt**, not an approval, and notify designated admins.
2. Authorized admin reviews the full original submission; approve or reject with a recorded actor, timestamp and optional internal reason. Reject invalid state transitions and duplicate decisions.
3. Store the decision before dispatching notification; use an outbox/queue or equivalent reliable approach for retry/deduplication. The member email clearly indicates approval or rejection, without leaking internal notes.
4. Approval records the member privately. Public visibility is always a **separate, opt-in editorial step**. People categories include `executive` and `researcher`; public profile must be explicitly published and contain an approved portrait/bio/role.
5. Use simple, editable subject/body templates with safe variables (`name`, `status`, `organisation`), and permit a short custom note when responding. Do not build a complex campaign email editor. If a manual Gmail response is desired, support an explicit copy/draft workflow without automatically treating it as sent.
6. Clarify required application fields, attachments if any, consent/retention wording, actual notification addresses, and rejection email policy before shipping the form.

## 7. Architecture and data boundaries

Preferred maintainable stack: **Next.js App Router + TypeScript + Tailwind CSS 4 + shadcn/ui (admin) + PostgreSQL** with a mainstream compatible ORM (Prisma is a candidate), server-side authentication (Auth.js is a candidate) and transactional email delivery (Resend is a candidate). Select specific versions/deploy targets only after confirming their compatibility and operational constraints; avoid introducing Express, Nest or an external CMS without a demonstrated need.

A suggested file layout (create paths when needed, not empty folders):

```text
src/
  app/
    layout.tsx
    globals.css
    (public)/
      layout.tsx
      page.tsx
      about/page.tsx
      events/page.tsx
      events/archive/page.tsx
      events/[slug]/page.tsx
      ...
    (admin)/
      admin/
        layout.tsx
        page.tsx
        members/
        news/
        events/
        people/
        settings/
    api/                  # only justified external/webhook endpoints
  components/
    site/                 # public site components
      layout/
      sections/
      cards/
      ui/
    admin/                # dashboard-specific composition
    ui/                   # shadcn primitives, not imported into public site
  lib/
    content/              # validated read layer and initial typed fixtures
    auth/
    db/
    email/
    validation/
  styles/
    tokens.css
  types/
public/media/
prisma/                   # when database phase begins
docs/
  PRD.md
  PROGRESS.md
  migration-map.md
  visual-baseline.md
  PUBLIC-SITE-STATUS.md
  FRONTEND-TRACKER.md
  admin/                  # future approved admin task briefs
.agents/skills/
AGENTS.md
```

- Use server components by default; add `"use client"` only at the smallest interactive boundaries.
- Public reads and private writes are separated; enforce authorization **within** every protected mutation/query, not just in the UI.
- Use structured content models and reusable validation rather than hard-coded copy scattered in JSX.
- During parity migration, typed JSON/TypeScript data may stand in for legacy file-backed PHP until the CMS's real database schema is introduced.
- Proposed backend entities (implement only when needed): `AdminUser`, `MembershipApplication`, `Member`, `PublicProfile` (for Leadership), `ResearchGroup`, `ResearchGroupMember`, `NewsArticle`, `Event`, `Publication`, `GalleryPhoto`, `GalleryAlbum`, `MediaAsset`, `SiteSetting` (approved Hero/Privacy fields), `EmailOutbox`/`EmailLog`, `AuditLog`. Monitoring-resource editing/entities are deferred. Treat private applicant details separately from published profiles.
- Do not run external scientific data APIs, email services or slow database queries on every anonymous page render. Cache public reads and revalidate after publication.

## 8. Lightweight performance and network requirements

### Non-negotiable engineering approach

- Initial HTML contains the primary content, links and forms. Avoid a page-sized client JS app on a content website.
- Ship as little browser JavaScript as possible. Do not import shadcn, charting or editor libraries into public route bundles.
- Use optimized responsive image sources (AVIF/WebP where supported, suitable fallbacks), intrinsic sizes, efficient mobile sizes, lazy loading below the fold and justifiable hero priority.
- Retain visual typography while minimizing font files, subsets and weights. Self-host; use font display strategies that avoid invisible text.
- Avoid autoplay video, blocking third-party embeds, unnecessary animations and trackers. Preserve important existing motion only if it respects reduced-motion settings and does not degrade readability.
- Use static rendering/revalidation for eligible content and CDN/asset caching; admin pages and membership submissions must be private and non-cacheable.
- Accessible forms should fail clearly, allow safe retries and avoid duplicate applications on intermittent networks.

### Measurement and quality targets

- Core Web Vitals field goals at the 75th percentile: **LCP <= 2.5s**, **INP <= 200ms**, **CLS <= 0.1**. These are goals, **not claimed measurements**, and must not be presented as guaranteed on very slow 3G.
- In discovery, establish representative low-end mobile and throttled-network profiles, then record **initial HTML/JS/CSS/image transfer sizes**, request count and interaction availability. Set route-specific budgets after that baseline, and keep budgets visible in progress evidence.
- Aim for minimal-to-zero custom client JavaScript on static content pages, with documented exceptions for menu/carousel controls; no unexamined heavy dependency.
- On slow or unstable connections, users must still see meaningful content and be able to recover from transient form failures. Distinguish field performance from controlled lab simulations.
- Reject features that would require disproportionately large downloads for minor visual benefit.

## 9. Delivery phases, gates and evidence

**Rule:** One narrow Codex task/branch per cohesive increment, pushed for owner inspection through a Vercel branch preview; a PR is optional and not created automatically. All tasks reference this PRD and update PROGRESS.md. No implementation can self-mark a milestone completed if its visual acceptance requires owner review.

| Phase | Codex deliverable | Exit gate |
| --- | --- | --- |
| **P0 — discovery and baseline** | Read-only Laravel audit, `docs/migration-map.md`, `docs/visual-baseline.md`, source-to-destination matrix, identify fixtures, record blockers | Documents grounded in code, implementation-versus-planned clearly distinguished; owner approves approach |
| **P1 — project & tokens** | Next.js scaffold, strict TypeScript/config, minimal dependencies, font/theme tokens and public component primitives | Typecheck/lint/build; token review, no unexpected UI package |
| **P2 — homepage parity** | Responsive shell/nav/footer and hero/monitoring/research/news/events sections | Selected route checks, screenshots at three widths, owner approval on parity |
| **P3 — existing secondary routes parity** | About, events index/archive/detail, search and meeting redirection | Focused behavior checks and route screenshots; no important regressions |
| **P4 — rest of public scope** | News, research, publications, data, products, outreach, meetings, people/join/support/contact/legal as approved | Working routes/content; provenance and link checks; new-page designs explicitly approved |
| **P5 — data and admin foundation** | DB/migrations, auth, admin shell, themed shadcn components, scoped content read/write services | Authz checks and private/public boundary proven; migrations and rollback clear |
| **P6 — membership and email** | Join form, application workflow, admin member views, email templates/logging | Pending→approved/rejected workflow checks, authorization, retry/failure checks and privacy review |
| **P7 — CMS & site settings** | News/events editor, public people curation, media, site/monitoring settings, publish/revalidation | Create/edit/preview/publish/unpublish checks and correct public reflection |
| **P8 — launch hardening** | SEO, 404/redirects, production deployment, backups, smoke checks, mobile performance review | Launch checklist passed, no critical failures, stakeholder signoff and rollback plan |

Phases P2/P3 may contain several small tasks or PRs. P4 and P5 can be prioritized differently with explicit approval, but **do not** build a CMS in the same PR as the initial visual refactor. Keep the legacy PHP application intact until the replacement is accepted. Do not deploy to production without explicit approval.

### Per-task minimum check (token-conscious)

1. Read affected legacy files and their callers, then make the smallest coherent diff.
2. Run relevant formatting/lint/typecheck checks on changed code where practical; perform targeted tests for changed logic or any security, persistence or email behavior.
3. Run one production build at the end of a meaningful implementation milestone; do **not** run an expensive full test suite after every trivial edit.
4. For public UI changes, compare screenshot(s) at agreed widths or explicitly report unavailable visual tooling; report any mismatch.
5. Record files changed, what was checked, any failed or skipped checks, residual risk, PR/commit links and which requirement IDs changed status.
6. Stop after the assigned task. No automatic next-phase implementation.

### Development close-out and temporary QA storage

**Owner decision (14 October 2026, after [Task 11 PR #11](https://github.com/thedanieldiya/nosee-new/pull/11) merged):** The original Laravel public port and scoped hardening are accepted **as a development milestone**. Normal-motion Lighthouse mobile median **3.535s (~3.54s)** is satisfactory for now; ≤2.5s and field CWV remain deferred, not passed. No further optimisation in Task 12.

The owner authorised one Task 12 branch combining final technical sanity, accurate deferred-release notes and complete deletion of temporary migration artifacts and completed source-migration briefs. Current-tree cleanup retains functional code/assets, reusable tests/compact independent fixtures, this PRD, source/design contracts, the Admin TRD and future admin briefs; Git history is not rewritten. [Public-site status](PUBLIC-SITE-STATUS.md) preserves decisions, exceptions, release gates and reproducible checks; [the tracker](FRONTEND-TRACKER.md) retains merged PR links. No new generated evidence archive. Future QA still runs fully as needed, with bulky outputs in temporary or CI storage.

Manual screen-reader/voice/magnifier review, live deployment/domain/field performance, factual/legal content, missing new pages, real newsletter delivery and indexing/launch remain separate open gates. Automated checks and merged development code cannot certify them. After the owner merges Task 12, **P5 is next**, through [Admin 01 secure foundation](admin/01-foundation.md) and [Admin Dashboard TRD v1.1](admin-dashboard-trd.md); deferred release gates do not alone block that separately approved engineering task. Owner retains PR/merge and production control.

### Definition of Done

A requirement is **Done** only if implemented on the destination branch, applicable checks have evidence, remaining differences are documented, and manual design/behavior approval is recorded when required. Task completion is not identical to PRD completion. A PR merged without required evidence may remain "In review" or "Blocked."

## 10. Progress tracking protocol

Codex must maintain [PROGRESS.md](PROGRESS.md) as a concise, persistent ledger, **not rewrite acceptance criteria to make progress look complete**.

- Status values: `Not started` / `In progress` / `Blocked` / `In review` / `Done`.
- Track a current phase, per-requirement ID status, evidence link (commit, PR, screenshot or targeted check), owner approval if required, blocker and next task.
- At task start: mark only the assigned phase/task `In progress`. At end: change statuses supported by actual evidence; mark `In review` for visual/UI approval, `Blocked` for unresolved dependencies.
- Never claim a feature implemented solely because it appears in the source code or this document.
- Update the log's last-updated date and append a short task history. If work is on a PR branch, update tracker on the **same branch** so progress is reviewable.
- PRD requirements are stable; proposed changes must be documented as decisions and approved before changing scope.

## 11. Dependencies, open decisions and risks

| Decision / risk | Owner and expected resolution |
| --- | --- |
| Codex access to both repositories | **Developer**: use `nosee-new` as writable destination and provide read-only `nosee` clone/reference; if unavailable, P0 must block rather than guess |
| Visual truth source and screenshots | **Developer**: compare live `nosee.org` to source; provide Figma reference if it remains authoritative, otherwise record source/live conflicts |
| Legacy branding `NSEE` vs `NOSEE` and placeholder copy | **NOSEE content owner**: approve accurate name, biographies, story, links and media before public release |
| Hero autoplay disagreement | **Developer/content owner**: agree whether to preserve current desktop behavior or follow earlier PRD |
| Field list/consent/retention for applications | **NOSEE administrator**: approve fields, privacy wording, lawful handling/retention and email recipients |
| Hosting, database and storage | **Developer**: choose provider/region and validate cost, compatibility, backup and file strategy before P5 |
| Email sender/domain and template policy | **NOSEE administrator**: approve sender identity, exact recipient address and rejection/approval wording |
| Newsletter provider, contact and donation workflow | **NOSEE administrator**: confirm before promising success or payment |
| Actual performance thresholds and production URLs | **Developer**: capture P0/P1 baselines, validate budgets and URL/redirect plan |
| Third-party monitoring resource rights | **Content owner**: verify attributions, update frequencies and external linking policy |

## 12. Scope approval and changes

The owner required a **strict 1:1 port of the existing PHP public website to Next.js, with no creative or editorial changes**, plus a proper Next.js folder structure, a source-extracted public design system, and a branded shadcn admin **as later, new functionality**. Those decisions are fixed unless changed explicitly. Every additional planned feature must be prioritized after parity and identified as new work, not falsely described as a migration of already implemented code.

**Current handoff:** Original Laravel frontend development is complete; Task 12 close-out/cleanup awaits owner review. Follow [PROGRESS](PROGRESS.md) and the [release checklist](PUBLIC-SITE-STATUS.md#deferred-release-checklist). Begin [Admin 01](admin/01-foundation.md) only in a separately authorised task after the Task 12 merge. Public parity, performance goals and private/public boundaries remain binding.
