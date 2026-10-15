# Admin foundation architecture and operator setup

**15 October 2026 · A01 · In review.** PostgreSQL-backed administration lives inside the existing Next.js app. Public pages still use their original content services; nothing is published from this database. Hosted preview provisioning and owner approval are outstanding.

## Selected stack and boundaries

| Selection | Reason / compatibility |
| --- | --- |
| Better Auth **1.7.9** | Maintained stable authentication; published peers include Next 16 / React 19. Vetted scrypt password hashing, signed cookies and database sessions; no custom password/session cryptography. |
| Drizzle ORM **0.45.4**, node-postgres **8.23.1** | Better Auth's supported PostgreSQL adapter, typed schema and real transactions. Node 24 meets pg's engine requirement. Small pool, connection/statement timeouts; no second backend service. |
| PostgreSQL **17** | Local integration uses an isolated official `postgres:17-alpine` container. A hosted PostgreSQL service is an **owner provision**, not an installed external integration. |
| shadcn New York / Radix Dialog and Dropdown | Locally owned/adapted button/input/card/sheet/menu primitives, NOSEE fonts/tokens, React 19-compatible peers. Individual Radix packages, no full component suite. [MIT notice](../../src/components/ui/LICENSE) retained. |
| MingCute **3.0.2** | Existing official per-glyph exports only; minimal sidebar/control icons, inherited text `currentColor`, no second icon package. |

Official guidance was read from [Better Auth's tagged source/docs](https://github.com/better-auth/better-auth/tree/v1.7.9/docs/content/docs) (Next integration, Drizzle adapter, security, sessions, database and rate limiting) and the [official shadcn registry](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui); direct documentation-host requests were forbidden. Installed versions, typechecking, production builds and actual PostgreSQL integration establish the tested compatibility. Future CLI-generated shadcn components must replace default icon imports with MingCute and apply NOSEE tokens.

- `(admin)/admin` owns private CSS and client components. A separate protected route group authenticates Overview/General; each page/data handler also verifies authority. Sign-in sits outside that protected layout.
- Server-only auth/database/session modules never enter public imports. Public Tailwind discovery excludes admin/UI directories; the private stylesheet generates their utilities separately, without changing public tokens/preflight. Proxy adds private/security headers to admin URLs; **authorization occurs in server pages and handlers**, independent of headers/sidebar visibility. Next 16’s `authInterrupts` supports real 403 boundaries; avoid an early page-loading boundary that flushes HTTP 200 before a denial. Recheck this experimental flag on framework upgrades.
- The schema/migrations contain only administrator identities, credentials, sessions, verification/rate-limit state, atomic login buckets and minimal audit events. There is no member-to-login relationship and no public signup. Role/scope are server-controlled fields; a Lead requires an assigned UUID scope. Research-group records/editors are future A06 work.
- Sessions expire after **eight hours**, with no sliding refresh or cookie cache. Authority/deactivation is reread from PostgreSQL on every protected read/write. Cookies are HttpOnly, host-only, SameSite=Lax and Secure on HTTPS. Browser JSON does not expose session tokens. Sign-out and password change revoke real database sessions; password change checks the current password and revokes other sessions.
- Mutations require the exact configured Origin and reject cross-site requests. JSON is size-bounded and schema-validated; profile fields are allowlisted to own first/last name. SQL is parameterised. Account-specific login throttling is atomic across instances: five attempts per 15 minutes, plus an application-wide 60/minute ceiling and library database-backed IP limits. Untrusted forwarded IPs cannot bypass the account limit.
- Bootstrap takes a PostgreSQL transaction advisory lock, checks existing Super Admins **and the permanent initial-provisioning audit marker**, then inserts identity/credential/audit atomically. It cannot be rerun to elevate a downgraded identity. Keep the marker/audit history; runtime DB grants should allow audit INSERT/SELECT, not deletion.

## Owner-required infrastructure

There are **no hosted DB credentials, auth secrets or provisioned hosted accounts in this branch/environment**. Missing/invalid configuration and an unreachable database fail closed; public reading remains operational. No production settings, external account connections, purchases or paid resources were changed.

| Variable | Required operator value |
| --- | --- |
| `DATABASE_URL` | Isolated PostgreSQL connection for this environment, preferably the provider's transaction-pool endpoint for Vercel. Remote connections must use `sslmode=verify-full`; supply the provider's trusted CA as needed. TLS verification must stay enabled. |
| `DATABASE_MIGRATION_URL` | Optional direct connection for controlled operator migrations; defaults to `DATABASE_URL`. Use a separate migration role where available. |
| `BETTER_AUTH_SECRET` | Independently generated cryptographic secret, at least 32 characters, unique to each preview/production environment. Generate directly into your secret manager; never paste it into chat/Git/logs. |
| `ADMIN_ORIGIN` | Exact browser origin, no trailing slash/path. HTTPS for hosted deployments; HTTP is accepted only for loopback development. It must match the actual preview hostname and local server port. |

Use the [empty environment template](../../.env.example). Real values belong in the approved secret store or ignored local environment file, never `NEXT_PUBLIC_*`. Give runtime PostgreSQL access only to the admin schema/tables needed by the app; never use a PostgreSQL superuser for hosted runtime. Review the SQL migration before applying it. App build/start does **not** run migrations or create administrators automatically.

For the hosted owner review: provision an **isolated non-production database**, configure these values in the **Vercel Preview** environment for this branch, run migrations from an authorised terminal, redeploy the preview and provide its actual URL. A runtime secret change needs a redeploy/restart. Vercel production configuration remains untouched. Never share production databases, identities, passwords, sessions or auth secrets with preview.

## One-time first Super Admin

From the intended checkout and a privileged **interactive terminal** with secure DB access and the intended environment loaded:

```bash
npm ci
npm run admin:migrate
npm run admin:bootstrap
```

The commands load an ignored `.env.local` if present; securely injected process variables take precedence. Bootstrap prompts for first name, last name, email, a **masked 15–128 character password**, and masked confirmation. No password arguments/env-variable input, no generated default/demo account, no public setup route and no email-provider dependency. The creation timestamp and provisioning audit are persisted. Subsequent or concurrent attempts refuse; initial provisioning cannot become a recurring role-escalation command.

Open **`/admin/sign-in` on the configured origin** and use the operator-chosen credential. Store it in the approved password manager, not a screenshot or PR comment. Do not run production bootstrap until production DB/deployment provisioning is explicitly authorised. Later administrator invitations, role changes and recovery belong to A02/security work, not a public signup or repeated bootstrap.

## Current user-visible scope and future modules

Overview shows the signed-in role/workspace and **real own-account audit events**; it has no fake organisation metrics. General saves own first/last name, persists through refresh and changes the password securely. Email is read-only until verification/onboarding is implemented; photo uploads are explicitly unavailable until secure storage exists. No inert Save/upload/forgot-password control pretends to work.

Super Admin navigation includes all approved modules; Editor has Overview/Publishing/Website/General; Lead has Overview/assigned Research/General. Future modules are marked **Soon**, with no clickable fake editors. The single guarded catch-all denies forbidden routes with **403**; authorised but unimplemented destinations return **404**. A Lead's Research root redirects to their assigned scope, whose editor is not implemented; other scope/create/member paths are denied. No Membership, Research, Publishing or Website forms exist. [TRD v1.2](../admin-dashboard-trd.md#6-approved-nextjs-app-router-page-tree) remains the canonical future tree.

## Local integration and safe review fixtures

Tests require a deliberately disposable **loopback PostgreSQL database named `nosee_admin01_test`** and a loopback app origin. They refuse other databases before destructive setup. Use the official PostgreSQL container with a randomly generated password held in a mode-0600 file outside Git; bind its port to loopback only. Apply `admin:migrate`, load the protected local env, build/start the app at the same `ADMIN_ORIGIN`, then:

```bash
npm run test:admin
```

The test suite uses real database identities, scrypt hashes and signed sessions. It exercises the actual masked CLI through a pseudo-terminal, bootstrap races, HTTP authentication, permissions, profile persistence and revocation. Test fixtures never enter migrations or app defaults. Setting `NOSEE_ADMIN_FIXTURE_FILE` to a private `/tmp/…` file optionally preserves random **local-only** role credentials for browser QA; that file is created mode 0600 and never printed. The suite resets its named test database; never run it against preview or production. Remove its container/private files when finished.

For a local hands-on fallback, use those legitimately provisioned isolated test accounts, retrieving access only through an approved secure local mechanism. This is **not** a hosted preview or a production account-seeding path. Hosted Editor/Lead review accounts must be separately provisioned by an authorised operator into the isolated preview DB through a secure internal process; do not expose a role-switcher/signup or reuse local test secrets. A02 provides the maintained invitation UI later. Owner-interactive hosted review remains **Preview blocked** until infrastructure and secure account access exist.

## Operations and remaining gates

Apply migrations explicitly and retain backups; roll back this additive foundation by removing its code/traffic first, never dropping a production database containing accounts/audit. Use a direct provider connection for migrations if transaction pooling disallows DDL. Retain auth/audit history; expired sessions/rate-limit rows need a separately scheduled retention policy before production scale. MFA, email verification/recovery, administrator invitations and fuller security operations are future bounded work, not silently enabled providers.

Production dependency audit reports **zero advisories** at this check. PostCSS was patched to 8.5.30 for its source-map advisories; the unnecessary migration generator and its esbuild chain were removed after generating the initial schema. Full `npm audit` still reports **five inherited high lint-toolchain alerts**, all through the unpatched `braces ≤3.0.3` stack-exhaustion advisory ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); published latest braces remains 3.0.3. This toolchain consumes trusted repository globs, not app request data. Do not call the full dependency audit clean or downgrade Next/ESLint unsafely; track the upstream fix.

Manual screen-reader/voice/magnifier testing, hosted TLS/domain/DB/provider review, owner hands-on approval and the existing [public release checklist](../PUBLIC-SITE-STATUS.md#deferred-release-checklist) remain open. See [A01 review](reviews/01-foundation.md) for actual measured checks, screenshots, blockers and walkthrough.
