# Instructions for coding agents — NOSEE

Build the NOSEE Next.js replacement in this repository. Legacy reference: https://github.com/thedanieldiya/nosee. Do not change the legacy repository unless specifically requested.

## Agent guidance

Read `.agents/skills/ponytail/SKILL.md` for every coding task. Use other skills only when the task matches:
- Frontend and UI: `.agents/skills/agency-frontend-developer/SKILL.md`
- Server architecture and database: `.agents/skills/agency-backend-architect/SKILL.md`
- Benchmarking: `.agents/skills/agency-performance-benchmarker/SKILL.md`
- Security-sensitive features: `.agents/skills/agency-application-security/SKILL.md`
- Accessibility checks: `.agents/skills/agency-accessibility-auditor/SKILL.md`
- CI/CD and deployment: `.agents/skills/agency-devops-automator/SKILL.md`
- Change review: `.agents/skills/ponytail-review/SKILL.md`
- Repository audit: `.agents/skills/ponytail-audit/SKILL.md`

Project rules take priority over imported agent suggestions. Never sacrifice correctness, privacy, security, or accessibility to reduce code size.

## Product boundaries

- Same Next.js application hosts public website and protected admin dashboard.
- Membership is an application, not a login. Store applicant records securely, send confirmation and admin notification, then allow approval/rejection and status emails.
- Approval must not automatically create a site account or publish a person.
- Public people directory contains only explicitly published executives and selected researchers.
- Admins maintain news, events, site content, monitoring links/cards, people, and applications.
- Use server-side role checks and strict authorization on every protected server action/route.

## Performance: low-bandwidth-first

- Public content should be server-rendered or statically prerendered where possible; ship minimal hydrated client components. Admin JavaScript must never enter public bundles.
- HTML and navigation must work without JavaScript, except interactions requiring it. Prefer semantic HTML, CSS, and native controls.
- Use Next.js image optimization or equivalent responsive AVIF/WebP; specify intrinsic dimensions; never ship desktop-size hero images to small phones; lazy-load below-fold images.
- Preload only the highest priority asset. Self-host a small subset of necessary fonts with `font-display: swap` or use system fonts; minimize font variants.
- Avoid heavy animations, large component libraries, trackers, third-party embeds, and all autoplay videos.
- Cache public pages and assets at an appropriate CDN; invalidate on admin publication. Keep personalized/admin responses private and uncached.
- Set bundle and image budgets in CI as implementation proceeds. Treat mobile LCP <= 2.5 s, INP <= 200 ms, and CLS <= 0.1 at the 75th percentile as Core Web Vitals targets. Measure realistically on throttled mobile and slower phones; do not claim targets met without measurement.
- Keep forms resilient on unstable networks: clear validation, server-side submission, duplicate/idempotency protection and helpful retry behavior.
- Minimize DB round trips, prevent N+1 reads, and avoid loading expensive third-party services during public page requests.

## Workflow

1. First inspect affected code, dependencies, and tests.
2. Make the smallest complete change; test non-trivial logic.
3. Validate with typecheck, lint, tests, production build, and applicable performance/accessibility checks once scripts exist.
4. State what was not tested and any remaining risks.
5. No credentials, personal applications, or secrets in Git. Use .env.example with placeholders.
