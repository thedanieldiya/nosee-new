# Laravel discovery and migration map

**Task:** [Task 01](codex-tasks/01-discovery-and-baseline.md) · **Phase:** P0, In review · **Inspected:** 2026-10-13.
**Legacy revision:** [`9872c4ed12aa48835eab71065c69b468424adb4a`](https://github.com/thedanieldiya/nosee/tree/9872c4ed12aa48835eab71065c69b468424adb4a).
**Destination baseline:** `62ed14cd4af9fd70ffcb5cdf113ad221bf32798e`; branch `codex/task-01-discovery-baseline`.
**Requirements:** [PRD](PRD.md); visual evidence and missing captures: [visual baseline](visual-baseline.md).

Legacy paths below are relative to the linked, pinned source tree. Proposed Next.js paths are recommendations, not existing implementation. The legacy checkout was inspected without modification. No packages, application code, migrations, or test suites were run for this task.

## 1. Source architecture and request flow

The source is a Laravel/Blade website with file-backed editorial records and small browser modules. There are no implemented editorial database tables, CMS, membership application workflow, or admin routes.

```text
routes/web.php → controller → content/event service → repository contract
             → file repository → FileContentLoader → content/*.php arrays
             → Blade page → shared layout/navigation/footer → HTML + Vite assets
```

- `app/Providers/ContentRepositoryServiceProvider.php` binds seven content contracts to file repositories. `FileContentLoader.php` resolves paths inside `content/`, requires arrays, rejects invalid kebab-case slugs/traversal, and sorts collection filenames alphabetically. It does not automatically apply every field schema when a page loads.
- `HomeController.php` / `HomepageContentService.php` combine `homepage.php` with monitoring, publication, news, and event queries. The controller sets `navigationOverlaysContent=true`.
- `AboutController.php` / `AboutContentService.php` load `about.php` without merging DB records. `EventController.php` delegates listing/search/archive to `EventListingService.php`; `EventDetailService.php` looks up one slug and presents it.
- `app/View/Components/Navigation/Navigation.php` loads enabled navigation records; exact and nested root-relative paths set active/current state, including active children. URL fragments do not distinguish About subsections for active state.
- `AppServiceProvider.php` supplies schema-validated footer data whenever `layouts.app` renders. `ContentValidationService.php` and `ContentSchemaRegistry.php` define the wider offline content checks. Framework users, sessions, cache, and jobs migrations are not evidence of a working editorial CMS or public login.

## 2. Actual route inventory

Evidence: [routes/web.php](https://github.com/thedanieldiya/nosee/blob/9872c4ed12aa48835eab71065c69b468424adb4a/routes/web.php), `bootstrap/app.php`, and the four concrete controllers in `app/Http/Controllers/`.

| Method/path | Classification | Actual source behavior | Proposed destination |
| --- | --- | --- | --- |
| GET `/` | implemented | `HomeController` → `pages/home.blade.php`; five homepage sections | `src/app/(public)/page.tsx` |
| GET `/about` | implemented | `AboutController` → `about/index.blade.php`; `#mission`, `#leadership`, `#collaborations` anchors | `src/app/(public)/about/page.tsx` |
| GET `/events?q=…` | implemented | `EventController@index` → `events/index.blade.php`; query trims; only upcoming records are filtered | `src/app/(public)/events/page.tsx` |
| GET `/events/archive` | implemented | `EventController@archive` → `events/archive.blade.php`; past events grouped newest first | `src/app/(public)/events/archive/page.tsx` |
| GET `/events/{slug}` | implemented | `EventController@show`; regular detail, meeting external redirect, unknown slug 404 | `src/app/(public)/events/[slug]/page.tsx` |
| POST `/newsletter/subscribe` | partial | Email validation, 10 requests/minute throttle, stderr log, JSON acknowledgement; no storage or delivery | Preserve URL with a route handler only when the approved newsletter behavior is implemented |
| GET `/up` | implemented, technical | Laravel framework health route configured in `bootstrap/app.php`; not an editorial page | Decide deployment health endpoint during operations work |

There are **five public GET route definitions, one partial POST endpoint, and one framework health endpoint**. The common 404 template is implemented as an error view, not another public route.

| Currently missing public capability | Classification/evidence | Later scope |
| --- | --- | --- |
| `/research` and five research-area links | partial: index singleton and one `climate-science` record; no page templates/routes | P4, approved research landing/detail pages |
| `/data`, `/products`, `/publications`, `/news`, `/news/{slug}`, `/outreach` | partial: records/repositories and some homepage cards exist; full pages/routes do not | P4; preserve Data/Products distinction |
| `/meetings` | planned: meeting records are mixed into Events and redirected; no dedicated meeting page | P4, owner-approved discovery page |
| `/multimedia`, `/people`, `/join`, `/support`, `/contact`, `/privacy`, `/terms` | planned: PRD or links; no usable routed page | P4/P6 as appropriate, approved content first |
| `/participate`, `/partnerships` | planned: About collaboration links only | Owner must approve page or redirect destination |
| `/login`, `/admin` | planned: Login link is enabled, but no authentication/admin endpoint exists | P5; do not migrate it as a member login |

Empty `.gitkeep` directories for data/meetings/news/outreach/products/publications/research/forms/media are scaffolding, not implemented pages/components. All six non-layout Blade page/error views are reachable through the five GET definitions or error handling; no additional complete, unrouted Blade page was found. The 21 Blade components are composed by those views; their presence does not create routes.

## 3. Source → proposed React composition

Paths abbreviated under `resources/views/` in this table. Preserve each component's actual responsive markup and data contract before introducing new abstractions.

| Source path(s) | Proposed Next.js path/component | Responsibility |
| --- | --- | --- |
| `layouts/app.blade.php` | `src/app/layout.tsx` + `(public)/layout.tsx`; `components/site/layout/SiteShell.tsx` | Document metadata/assets, skip link, public shell; homepage overlay vs secondary-page offset |
| `components/navigation/{desktop-navigation,desktop-primary-links,mobile-navigation}.blade.php`; `app/View/Components/Navigation/Navigation.php` | `components/site/layout/SiteNavigation.tsx`, small mobile/menu client boundary; `lib/content/navigation.ts` | Two desktop tiers, Data & Products dropdown, mobile submenus, current/active state |
| `components/footer/site-footer.blade.php` | `components/site/layout/SiteFooter.tsx`; isolated newsletter client boundary if needed | Contacts, social/legal links, newsletter, responsive reading order |
| `components/ui/{container,button,arrow-right}.blade.php` | `components/site/ui/{Container,ButtonLink,ArrowRight}.tsx` | 90rem container, validated button variants, decorative mask icon |
| `pages/home.blade.php` | `(public)/page.tsx` | Hero → monitoring → research outputs → trending → upcoming events |
| `components/home/hero.blade.php`; `resources/js/hero-carousel.js` | `components/site/sections/HomeHero.tsx`; small carousel client boundary | Two editorial slides, images/credits/CTA, indicators, desktop timer/mobile swipe |
| `components/home/monitoring-dashboard.blade.php`; `components/cards/monitoring-dashboard-card.blade.php` | `components/site/sections/MonitoringDashboard.tsx`; `components/site/cards/MonitoringCard.tsx` | Three strictly selected records and external-source attribution |
| `components/home/research-outputs.blade.php`; `components/cards/research-output-card.blade.php` | `components/site/sections/ResearchOutputs.tsx`; `components/site/cards/ResearchOutputCard.tsx` | Three featured publications; DOI action desktop only |
| `components/home/trending-news.blade.php`; `components/cards/trending-news-card.blade.php` | `components/site/sections/TrendingNews.tsx`; `components/site/cards/NewsCard.tsx` | One leading square + three compact articles; responsive fourth action tile |
| `components/home/upcoming-events.blade.php`; `components/cards/event-card.blade.php` | `components/site/sections/UpcomingEvents.tsx`; `components/site/cards/EventCard.tsx` | Three featured/non-past records; compact homepage formatting |
| `about/index.blade.php`; `components/about/profile-carousel.blade.php` | `(public)/about/page.tsx`; `components/site/sections/{AboutIntro,Mission,Quote,Story,Leadership,Collaboration}.tsx` as reuse warrants | Editorial grids, viewport-specific copy/images, seven placeholder profiles |
| `events/{index,archive,show}.blade.php` | `(public)/events/{page,archive/page,[slug]/page}.tsx` | Listing/search, historical groups, detail or redirect |
| `components/events/{featured-event,listing-event-card,day-group,month-heading}.blade.php` | `components/site/events/{FeaturedEvent,ListingEventCard,EventDayGroup,EventMonthHeading}.tsx` | Date/time panels, type colors, grouped rows, sticky month heading |
| `errors/404.blade.php` | `(public)/not-found.tsx` | Missing-page message within public shell |
| `resources/css/app.css`; `config/event-types.php` | `src/styles/tokens.css`; event presentation map in `lib/content/events.ts` | Exact palette/fonts/base rules; six event palettes |
| `resources/js/{navigation-state,mobile-navigation,profile-carousel,newsletter}.js` | Corresponding small site client boundaries | Scroll state, focus-managed drawer, profiles, newsletter feedback |
| `resources/js/{app,homepage-animations}.js` | Homepage-only motion module, if approved | Dynamic Motion import; no motion dependency in other page execution paths |
| `public/media/`, `public/{logo,logoWhite}.png` | Same `public/` paths initially | Preserve case-sensitive names, intrinsic dimensions, credit/alt text and crops |

### Minimal destination layout (proposal only)

```text
src/app/layout.tsx, globals.css
src/app/(public)/layout.tsx, page.tsx, about/, events/
src/app/(admin)/admin/                 # P5+, never created in P0/P1
src/components/site/{layout,sections,cards,events,ui}/
src/components/admin/                 # P5+, dashboard composition
src/components/ui/                    # P5+, shadcn admin primitives
src/lib/content/                      # typed file adapter, selectors, presentation
src/lib/{validation,auth,db,email}/    # introduce individual modules when needed
src/styles/tokens.css
src/types/                            # only shared domain types
public/media/
```

Route groups do not alter URLs. Use server components for content/layout; client boundaries only for the actual interactions. Keep public primitives under `site/ui`; dashboard shadcn imports stay under admin paths. Do not introduce Express, an external CMS, generic repository frameworks, or empty backend folders during parity. PostgreSQL/ORM/auth/email choices remain proposals in PRD section 7, not decisions made by discovery.

## 4. Data translation and selection contracts

Inventory: **40 PHP content files**: five singletons and 35 collection records. Typed TypeScript/JSON fixtures can support P1–P3 without a DB. Later storage must preserve the same read contract and separately model private administration.

| Legacy source → initial typed boundary | Count / fields and preserved rules | Eventual editorial data, proposed only |
| --- | --- | --- |
| `content/site.php` → `lib/content/site.ts` | Name/tagline/footer; contact/social/legal URLs, enabled newsletter, copyright | Site settings; newsletter provider remains separate |
| `content/navigation.php` → `lib/content/navigation.ts` | Six primary/four utility items; ordered enabled children and active-path semantics | Approved navigation settings only if required |
| `content/homepage.php` → `lib/content/homepage.ts` | Two hero items in array order; IDs, copy, images, credit, CTA | Site/hero settings |
| `content/about.php` → `lib/content/about.ts` | Three viewport copy variants, picture sources, three objectives, quote/story, seven profile placeholders, three actions | Site copy + explicitly published public profiles; not members |
| `content/research/{index.php,areas/*.php}` → typed research data | One index + one area; preserve slug/featured; navigation has five areas but four lack records | Research records as P4/CMS scope warrants |
| `content/data/items/*.php` → `lib/content/monitoring.ts` | Four records; exactly three `homepage_monitoring === true`, alphabetic filename order; provider/ownership/source URL/alt | MonitoringResource; preserve external attribution |
| `content/products/items/*.php` → typed product data | One planned starter product; nullable URL/status | Product only when approved public scope needs it |
| `content/publications/*.php` → typed publication data | Ten; featured strictly true; newest `publication_date` first, slug ascending tie-break; first three | Publication only when that CMS scope is justified |
| `content/news/*.php` → typed news data | Nine; featured first, then ISO `published_at` string descending, slug ascending; first four | NewsArticle; explicit publishing states later |
| `content/events/*.php` → `lib/content/events.ts` | Nine; six types; dates, nullable end, timezone, schedule/itinerary, location, deadlines, meeting/registration/resource URLs | Event with publication controls later |
| `content/outreach/*.php` → typed outreach data | One planned starter programme; slug/status | Outreach only when approved |

Current homepage selections: monitoring `average-f-region-observations`, `range-error-from-tec`, `tec-difference-from-30-day-median`; publications `low-latitude-geomagnetic-storm-responses`, `urban-aerosol-optical-depth-patterns`, `satellite-soil-moisture-drought-signals`; news `solar-storm-monitoring-exercise`, `space-station-instrument-calibration`, `air-quality-smoke-transport-study`, `regional-earth-observation-partnership`. At the discovery date, featured homepage events order is `regional-space-weather-conference` (2027-03-10), `earth-observation-data-workshop` (2027-04-21), `atmospheric-measurement-seminar` (2027-05-14); this is source-derived, not a rendered observation.

### Event behavior that must survive translation

Evidence: `FileEventRepository.php`, `EventListingService.php`, `EventDetailService.php`, `EventController.php`, and `config/event-types.php`.

- Homepage selects strictly featured events whose `end_date ?? start_date` is at least PHP's **server-local today**, sorts start date then slug, and takes three. This is distinct from the listing's per-event timezone/time-of-day calculation; do not silently unify them.
- Listing converts `now` to each event timezone. Meeting/multi-day records are upcoming before their start date, ongoing through the inclusive end date, then past. Regular single-day records compare local start/end instants; missing end time means end of day. At the exact start/end instant the record is ongoing.
- Ongoing/upcoming sort by start date, then regular single-day start time (otherwise `00:00`), then slug. Featured is the first **upcoming featured meeting**, otherwise the first upcoming record. Selection occurs **before search**; featured remains in the upcoming list rather than being removed. Current ICELLI is a non-featured meeting; it can be the fallback featured listing card even while the homepage features different events.
- Trim `q`; blank becomes null. Case-insensitive substring matching covers title, summary, type, venue/address/city/country/platform and organiser. Only upcoming records are filtered: ongoing and featured remain unchanged. Month/day groups use **start date**, even for cross-month events.
- Archive includes past records only; reverses date/time/slug comparison and groups by start year/month/day, so descending ties also reverse slug order. It omits application deadlines. Detail retains a past deadline as `Applications closed`; future deadlines show `F j, Y at g:i A`. Time labels use `g:i A`; date-range formatting compresses matching months/years.
- Meeting links use `meeting_site_url`, and direct `/events/{meeting-slug}` redirects externally (Laravel's default 302). Listing cards open external links in a new tab with `noopener noreferrer`; compact homepage cards do not set that new-tab behavior. Unknown slugs use the shared 404. Resources/registration are external links, not implemented registration processing.
- Schedule validation: real booleans, valid timezone/ISO date/offset deadline, six types; single-day regular start time required and later optional end; multi-day regular top-level times null with ordered, unique itinerary dates covering the whole range. Meeting site must be HTTPS; regular events must not supply it. Slug must match filename.

`ContentValidationService::validateAll()` additionally fixes counts to three monitoring, three featured publications, one featured news, nine events and three featured non-past events; past featured records fail. These are legacy seed/homepage constraints, not an approved permanent CMS cardinality policy. The loader's array/path checks are distinct from schema validation; the initial TypeScript adapter should validate its typed boundary rather than merely trust a JSON cast. Existing ISO-string ordering must be distinguished from chronological ordering if future offsets differ.

## 5. Content approval and source discrepancies

| Evidence | Finding / owner decision |
| --- | --- |
| All nine `content/events/*.php`, nine `content/news/*.php`, ten `content/publications/*.php` | Explicitly marked development fixtures, not approved NOSEE facts. Preserve as clearly labeled parity data; do not publish as verified editorial material. DOI format checks do not establish real publication provenance. |
| `content/about.php` | Seven numbered leadership placeholders, `Role to be confirmed`, Earth/solar images instead of portraits; story explicitly development copy; quote credited to `John Doe`; intro contains mockup commentary and different mobile/tablet/desktop wording. Approval required. |
| `content/site.php`, `content/navigation.php` | `NSEE`, `Join NSEE`, `About NSEE` conflict with NOSEE page branding; social URLs are provider homepages. Correct name/links/contact details need owner approval, not silent replacement. |
| Research/data/product/outreach starter files | One of five research areas has a record; starter dataset/product/outreach/index copy is not approved organisational content. |
| `content/homepage.php` | Hero title spells `Colloquim`; AGM CTA `/events/nosee-annual-general-meeting` has no matching event file (different from hero ID). Record the broken link; do not invent an event. |
| Legacy `README.md` vs `routes/web.php` | README's two-endpoint claim is stale; About and Events routes are implemented. Use route source as evidence. |
| Legacy PRD §9.1 vs `hero-carousel.js` | PRD says no autoplay and mentions previous/next controls; source uses six-second desktop autoplay, indicators and mobile swipe, without hero arrow controls. Source/mobile hero is 750px; PHP/JS tests still assert `78svh`. Owner must choose the authoritative behavior/height. |
| Legacy PRD §9.6 vs newsletter controller/JS/footer | Log-only acknowledgement triggers a `Subscription confirmed` dialog promising email. New NWS-01 requires real storage/provider and honest messaging. `bootstrap/app.php` forces JSON errors only on `api/*`, while newsletter is a web route; validation response handling needs a later decision/check, not a P0 fix. |
| New PRD VIS-01 vs `app.css` | Semantic line/border tokens are specified by source; preserve their exact alpha values. Instrument Sans is declared as a fallback sans token but is not imported/used for the brand body/headings. |

No live/source visual difference can be confirmed: the live host was inaccessible. Figma authority and browser parity remain owner-review questions, not inferred findings.

## 6. Scope separation and bounded sequence

| Phase | Coherent next chunks / exit gate |
| --- | --- |
| P0, this task | Source map and source-derived visual baseline; missing screenshots explicit; owner reviews before P1 |
| P1 | Scaffold only App Router/strict TypeScript/Tailwind, local fonts/tokens and public Container/ButtonLink/ArrowRight; minimal dependency selection; typecheck/lint/build and token review |
| P2 | Separate shell/nav/footer, hero, and remaining homepage section parity chunks; focused behavior checks and matched three-width captures; owner review |
| P3 | About, then Events listing/archive/detail/redirect chunks; timezone/search assertions and matched captures |
| P4 | Approved missing public routes/content; these are new pages with separately approved designs, not parity claims |
| P5 | After public foundation/parity gates: database, server-side auth/authorization, branded shadcn admin shell; no applicant login |
| P6 | Private application → admin decision → reliable status emails; approval does not create login or publish a person |
| P7 | Explicit editorial publishing, public-profile curation, media/settings and cache invalidation |
| P8 | SEO/404/redirects, security/rollback/deployment and measured slow-mobile performance, stakeholder signoff |

**One recommended Task 02:** after P0 owner review, execute the bounded P1 foundation described above; create no homepage sections, CMS, auth, membership forms or email integration in that task. Confirm the Next.js/React/Node compatibility choice then, rather than pinning unverified versions here.

Backend entities in PRD section 7 (`AdminUser`, `MembershipApplication`, `Member`, `PublicProfile`, `EmailOutbox`, etc.) are proposals. No Laravel applicant/member/publication workflow is being migrated. Resolve application fields/consent/retention, hosting/database/storage, email identities/retry policy, newsletter provider and monitoring rights before the corresponding later phase; these decisions do not block reading P0 source.

## 7. What not to change without a recorded decision

Preserve implemented paths, slugs, hash anchors and redirect intent; exact copy/ordering until content approval; Ubuntu Sans/IBM Plex Sans and used weights; responsive thresholds, container gutters and image crops; navigation link semantics/focus/current state; carousel/manual/reduced-motion behavior; source attribution and asset filename case. Do not replace placeholders with invented facts, copy the misleading newsletter promise as working delivery, introduce admin JS into public routes, or treat old/new PRD plans as implemented source behavior.

## 8. Inspection evidence and limits

Read: legacy README/PRD and architecture guidance; routes/bootstrap/controllers; seven contracts/file repositories; content services/path/schema validation and provider/nav bindings; all public page/layout/component templates and seven browser modules; all 40 content files (selected fields/provenance); image dimensions/file sizes, font imports and existing manifest. Inspected relevant EventListingService, About, archive/detail/listing/newsletter and homepage test assertions, content-validation tests, and JS menu/carousel/motion/newsletter expectations **without executing tests**.

No Next.js code, dependency installation, source refactor, Laravel mutation, application build, full suite, Lighthouse run, or deployment occurred. No successful live-site or visual-parity assertion is made. Screenshots/network measurements and owner signoff remain gates; see the per-state reproduction matrix in [visual-baseline.md](visual-baseline.md).
