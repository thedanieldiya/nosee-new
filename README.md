# NOSEE — Next.js

Network of Space–Earth Environmentalists website. The [original Laravel repository](https://github.com/thedanieldiya/nosee) remains read-only.

**The original public frontend migration is complete as a development milestone**, with ten port tasks and [Task 11 hardening](https://github.com/thedanieldiya/nosee-new/pull/11) merged. [Task 12 PR #12](https://github.com/thedanieldiya/nosee-new/pull/12) has merged, completing the technical close-out and removal of all migration evidence. **Public launch is separate:** manual accessibility, live deployment, factual/legal content and indexing remain deferred. Mobile Lighthouse LCP **~3.54s is accepted for now**, with the ≤2.5s goal deferred. See [public-site status](docs/PUBLIC-SITE-STATUS.md), [progress](docs/PROGRESS.md) and the [merged-task tracker](docs/FRONTEND-TRACKER.md).

## Development

Use **Node.js 24.x** and npm; `.node-version` and `package.json` agree. Current stack: Next 16.4.0, React 19.3.0, TypeScript 5.9.3, Tailwind 4.3.3. Exact versions remain in `package-lock.json`.

```bash
npm ci
npm run dev
```

Validation and local production:

```bash
node --test tests/*.test.mjs
npm run typecheck
npm run lint
npm run build
npm run start
```

Typecheck generates Next route types before strict TypeScript. Lint uses Next's flat ESLint config. On hosts with an unwritable cache, use `npm --cache /workspace/.cache/npm ci` or another writable cache. ESLint 9.39.5 remains pinned for the installed Next plugin peer ranges; upgrade the stack together when peers support ESLint 10. No peer verification bypass.

## Implemented public application

- Source-faithful shared navigation/footer, tokens and self-hosted Ubuntu Sans/IBM Plex Sans; `font-display: swap`, no Google-font build requests. General UI icons use **official MingCute only**, with text/control `currentColor` in every state.
- Complete five-section homepage: hero/carousel, monitoring, research, trending news and upcoming events. Server-rendered per request for the original **UTC** homepage selector. Native responsive AVIF/WebP images retain originals as fallbacks; first hero is prioritised, below-fold rasters lazy. The approved six-stage entrance remains; other inactive source reveals stay inactive.
- Complete static `/about`: responsive editorial copy/images, mission/objectives, quote/story, seven-profile leadership carousel and collaborations. Source placeholders remain explicitly unapproved content.
- Dynamic `/events` and `/events/archive`: native desktop GET search, original event-specific timezone/date state, featured/ongoing/upcoming selection and archive ordering. Eight regular `/events/[slug]` detail pages preserve original content, deadlines and optional itinerary/resources/people.
- `/events/icelli2026` returns **HTTP 302** to exactly `https://icelli.nosee.org`, including HEAD/query/encoded/trailing-slash cases. Missing routes render the shared SSR **404**. Next's global not-found boundary and narrow Proxy preserve complete HTML and encoded meeting handling; trailing slashes render directly.
- Small controllers handle the JS menu/focus/scroll and source carousels; native disclosure navigation and anchor clearance work without JS. Newsletter keeps its source appearance and an honest error; no provider, email transmission or native POST is implemented.

Original layouts, wording, routes, breakpoints, data and interactions remain authoritative with only [documented authorised exceptions](docs/PUBLIC-SITE-STATUS.md#implemented-scope-and-enduring-exceptions). Fixture routes remain `noindex, nofollow`. Critical unimplemented destinations, old AGM 404 and medium source issues remain tracked. The public site does not depend on the admin database. The A01 foundation below adds private auth/account capabilities; CMS/membership/email implementation remains future scope.

## Next phase and delivery documents

The next development task is [Admin 01 — secure foundation](docs/admin/01-foundation.md), under the [approved Admin Dashboard TRD v1.2](docs/admin-dashboard-trd.md) and the **[13-task Admin Dashboard tracker](docs/admin/TRACKER.md)**. Admin work now requires a real **owner-interactive, authenticated browser preview** for each task; screenshots are supplemental, and blocked Vercel previews must be reported accurately. Later membership applications have **no applicant login**; member records remain private, and public profiles require deliberate publication. Admin approval never creates a login or publishes a person automatically.

- [PRD](docs/PRD.md) — stable product/acceptance requirements.
- [Progress](docs/PROGRESS.md) and [frontend tracker](docs/FRONTEND-TRACKER.md) — current status and merged PR traceability.
- [Public-site status](docs/PUBLIC-SITE-STATUS.md) — approved exceptions, accepted lab baseline and deferred release checklist.
- [Source map](docs/migration-map.md) and [design reference](docs/visual-baseline.md) — enduring source architecture, content and design contracts.
- [Agent instructions](AGENTS.md) — coding/verification/branch policy.

Temporary migration screenshots, exports/reports and completed briefs have been removed from the current tree. Historical commits/PRs remain; reusable tests, compact independent runtime fixtures and functional original/optimised assets are retained. Keep future generated QA outside Git.

## Admin foundation (A01 — In review)

PostgreSQL + Drizzle + Better Auth provide real administrator sign-in/out, fixed eight-hour sessions, server-side Super Admin/Editor/scoped Lead permissions and a one-time masked **`npm run admin:bootstrap`** CLI. The private Shopify-inspired shadcn/MingCute shell includes Overview and persistent own-name/password settings. Future modules are disabled, with no fake metrics or simulated authentication. Public bundles exclude admin libraries.

[Operator setup/architecture](docs/admin/architecture.md) documents required `DATABASE_URL`, `BETTER_AUTH_SECRET`, exact `ADMIN_ORIGIN`, optional direct migration URL, TLS, migrations and secure initial provisioning. Run `npm run admin:migrate` then `npm run admin:bootstrap` from an authorised interactive terminal for the intended environment. No default accounts/passwords, signup, auto-migration or build-time provisioning. Missing infrastructure fails closed.

[Review/screenshots/walkthrough](docs/admin/reviews/01-foundation.md) and [Admin tracker](docs/admin/TRACKER.md) distinguish local real-PostgreSQL validation from **Preview blocked** hosted/owner review. `npm run test:admin` requires the explicitly named disposable loopback test database and local app; it refuses production/preview databases. A01–A07 are merged, including the A07.1 News correction and follow-up PR #28. See the [current A07.1 setup, verification and owner walkthroughs](docs/admin/07-1-news-workflow-public-wat-toasts.md). News and Research workspaces are implemented; uploads, live email acceptance and remaining modules stay separately gated.

## Preview deployment

Push a task branch for the owner's configured Vercel Git integration, report only a verified actual preview URL, and stop for review. Codex does not automatically create PRs, merge or change production settings. GitHub status/Vercel access has returned HTTPS CONNECT 403 here; local checks are not proof of a live deployment. No production domain is presented as a branch preview.

## Development guidance and performance

Prefer server-rendered content, small client boundaries, responsive images and no unnecessary third-party requests. Keep admin/shadcn/editor dependencies out of public bundles. Preserve the current accepted baseline; measure future approved changes without claiming field CWV from local lab results.

Project-local [skills](.agents/skills/) are development tooling, not runtime dependencies: [Ponytail](https://github.com/DietrichGebert/ponytail) and selected [Agency Agents](https://github.com/msitarzewski/agency-agents). Licenses/attribution remain in [third-party notices](.agents/THIRD_PARTY_NOTICES.md).
