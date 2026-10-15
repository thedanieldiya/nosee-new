# Admin foundation architecture and operator setup

**15 October 2026 · A01/A02 and Resend PR #18 (`1204b06`) merged; A03 in review.** PostgreSQL-backed administration lives inside the existing Next.js app. Public pages still use their original content services; nothing is published from this database. The owner reports main's prelaunch Neon-backed Super Admin walkthrough passed; branch-preview and A02 delivery acceptance remain outstanding.

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
- The schema/migrations contain administrator identities, credentials, sessions, verification/rate-limit state, atomic buckets, separate pending invitations/send metadata and structured audit events. There is no member-to-login relationship or public signup. A02 only invites/assigns Super Admin and Editor; new Lead assignments are disabled until A06 provides real groups. Existing scoped Lead checks remain intact.
- Sessions expire after **eight hours**, with no sliding refresh or cookie cache. Authority/deactivation is reread from PostgreSQL on every protected read/write. Cookies are HttpOnly, host-only, SameSite=Lax and Secure on HTTPS. Browser JSON does not expose session tokens. Sign-out and password change revoke real database sessions; password change checks the current password and revokes other sessions.
- Mutations require the exact configured Origin and reject cross-site requests. JSON is size-bounded and schema-validated; profile fields are allowlisted to own first/last name. SQL is parameterised. Account-specific login throttling is atomic across instances: five attempts per 15 minutes, plus an application-wide 60/minute ceiling and library database-backed IP limits. Untrusted forwarded IPs cannot bypass the account limit.
- Bootstrap takes a PostgreSQL transaction advisory lock, checks existing Super Admins **and the permanent initial-provisioning audit marker**, then inserts identity/credential/audit atomically. It cannot be rerun to elevate a downgraded identity. Keep the marker/audit history; runtime DB grants should allow audit INSERT/SELECT, not deletion.

## Owner-required infrastructure

The owner has provisioned main's prelaunch Neon database and initial Super Admin; **this execution environment has no hosted DB/auth bindings and does not connect to or modify that database**. Missing/invalid configuration and an unreachable database fail closed; public reading remains operational. No production settings, external account connections, purchases or paid resources were changed.

| Variable | Required operator value |
| --- | --- |
| `DATABASE_URL` | Pooled runtime PostgreSQL URL. Neon's Vercel integration supplies `sslmode=require`; the application normalises that value **in memory** to `sslmode=verify-full` before the driver connects, preserving verified certificate/hostname checks. Do not modify or reveal integration-managed credentials. Weaker SSL modes remain rejected. |
| `DATABASE_MIGRATION_URL` | Optional direct operator override. Migration command prefers this, otherwise Neon's `DATABASE_URL_UNPOOLED`, and then `DATABASE_URL`. Always use the direct endpoint for migrations when available; provide least-privilege credentials. |
| `BETTER_AUTH_SECRET` | Independently generated cryptographic secret, at least 32 characters, unique to each preview/production environment. Generate directly into your secret manager; never paste it into chat/Git/logs. |
| `ADMIN_ORIGIN` | Exact browser origin, no trailing slash/path. HTTPS for hosted deployments; HTTP is accepted only for loopback development. It must match the actual preview hostname and local server port. |

**Neon managed-connection compatibility (15 October 2026):** The Vercel Marketplace provides `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct), generally with `sslmode=require`. Both the runtime pool and migration CLI now upgrade only that recognized remote mode to `verify-full` in memory, so Neon's Vercel-owned secrets stay unchanged. This is **not** permission to switch off TLS verification or use `DATABASE_POSTGRES_URL_NO_SSL`. Reject missing/ambiguous/weaker remote SSL configuration. Review and test the change in its separate branch before merging or redeploying.

**Operator limitation:** Vercel's dashboard Database Browser offers SQL queries and data browsing, but it does **not** run this application's masked, interactive `npm run admin:bootstrap` command. Vercel production **Secret** environment variables also cannot be pulled back out through the dashboard or CLI. To do the initial migration/bootstrap, use a trusted operator-controlled terminal (local Node 24 or a secure browser development workspace) and separately inject the intended Neon **direct** connection and `BETTER_AUTH_SECRET` through a private secret mechanism; never try to paste or reconstruct hidden Vercel Secrets into chat, source, SQL Editor or build logs. Run against this environment **only** after owner verification, and avoid any setup endpoint or build-time bootstrap.

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

Super Admin navigation includes all approved modules; Administrators and Activity log are functional in A02. Editor has Overview/Publishing/Website/General; Lead has Overview/assigned Research/General. Future modules remain **Soon**, with no fake editors. The guarded catch-all denies forbidden routes with **403**; authorised but unimplemented destinations return **404**. A Lead's Research root redirects to their assigned scope, whose editor is not implemented; other scope/create/member paths are denied. No Membership, Research, Publishing or Website forms exist. [TRD v1.2](../admin-dashboard-trd.md#6-approved-nextjs-app-router-page-tree) remains the canonical future tree.

## A02 invitation, access and audit boundary

`0001_administrators_activity.sql` is additive: separate invitation/send tables, nullable audit target/change fields, default-zero user/session access versions. Existing A01 identities, hashes, sessions and bootstrap marker are preserved. No migration runs on build/start or against hosted databases automatically. Apply the reviewed migration before running the new admin code; an unmigrated database fails closed.

All directory/log queries and mutations require current Super Admin authority. A PostgreSQL transaction advisory lock serializes management and redemption; mutation transactions recheck actor role/active/version, protect self/last-Super-Admin access, delete target sessions, increment the access version and append safe audit data atomically. Session reads compare the issued version with the current user version, preventing delayed old session inserts from regaining access on reactivation. The original bootstrap lock/marker remains unchanged.

Invitations are separate from login accounts. Codes are 256-bit cryptographic random values with only SHA-256 digests stored; expiry is 48 hours. Redemption performs cheap validation/rate checks before scrypt, then rechecks expiry/state/uniqueness under the transaction lock. It creates the identity, Better Auth credential and acceptance audits together, consumes the digest, keeps email unverified and requires normal sign-in. There is no new public signup/reset route. Actor/global/code buckets are persisted and bounded; no code is in a URL, audit, admin response or plaintext outbox.

The owner authorized a small **server-only Resend fetch adapter**, with no SDK or live service configuration. The factory returns null unless server-only `RESEND_API_KEY`, a valid bare `ADMIN_INVITATION_FROM` and exact HTTPS `ADMIN_ORIGIN` exist. Invite/Resend fail closed without invitation/send/audit writes when unavailable. The durable send-attempt UUID becomes the Resend idempotency key; explicit resend still rotates the code and creates a new attempt. An eight-second request deadline fits inside the existing ten-second service ceiling. There are no automatic retries; explicit rejection/429 is failed (token invalidated), while network/timeout/409/5xx or unrecognized success remains unconfirmed. Only valid HTTP 200 acceptance IDs are persisted, without implying inbox delivery. No plaintext retry payload or manual distribution fallback exists. See [Resend setup and current verification](resend-invitations.md), [historical provider proposal](email-provider-proposal.md) and [A02 core results](reviews/02-administrators-activity.md). Domain/DNS/account/secrets configuration, live sending and owner acceptance remain pending.

## A03 private membership boundary

[Membership contract and expiry operations](03-membership-applications.md) document the additive `0002` migration. Public `/join` submits validated data and mandatory review-purpose consent through a size-bounded same-origin server action. Separate application records never become Better Auth identities, sessions or Members. Private services recheck the existing active Super Admin/access version inside transactions, then serialize application decisions/expiry with advisory lock `4631003` (management lock first). Partial unique normalized-email and form-digest constraints back duplicate/idempotency checks. Server clocks enforce 720 elapsed hours, including decisions delayed on a lock; pending expiry retains data and final decisions.

Anonymous receipt/expiry audits have a genuine NULL/System actor, generic record ID/label and status changes only. Existing audit reads use LEFT JOIN and retain prior administrator events. Consent time and wording/policy versions stay on the private application, never in audit text. No identity-match service existed to reuse; A04 linking and A05 email remain unimplemented. The bearer/CLI sweep is prepared but **no unattended schedule is configured or verified**. Existing auth/session/bootstrap and Resend behavior remain intact.

## Local integration and safe review fixtures

Tests require a deliberately disposable **loopback PostgreSQL database named `nosee_admin01_test`** and a loopback app origin. They refuse other databases before destructive setup. Use the official PostgreSQL container with a randomly generated password held in a mode-0600 file outside Git; bind its port to loopback only. Apply `admin:migrate`, load the protected local env, build/start the app at the same `ADMIN_ORIGIN`, then:

```bash
npm run test:admin
npm run test:membership
```

The two sequential suites use real database identities, scrypt hashes and signed sessions, including migration preservation and invitation/access/audit races. Test fixtures never enter migrations or app defaults. Setting `NOSEE_ADMIN_FIXTURE_FILE` to a private `/tmp/…` file optionally preserves random **local-only** role credentials and an adjacent `invitation.json` for browser QA; files are mode 0600 and never printed. The suite resets its named test database; never run it against preview or production. Browser suites share fixtures and must also run sequentially. Remove the container/private files when finished. Never let an injected hosted `DATABASE_URL` override a local test file: explicitly select a disposable child-process environment before running these commands.

For a local hands-on fallback, use those legitimately provisioned isolated test accounts, retrieving access only through an approved secure local mechanism. This is **not** a hosted preview or a production account-seeding path. Hosted Editor/Lead review accounts must be separately provisioned by an authorised operator into the isolated preview DB through a secure internal process; do not expose a role-switcher/signup or reuse local test secrets. A02 supplies the maintained invitation UI, but its delivery remains gated until provider approval and real-inbox verification. Owner-interactive hosted review remains **Preview blocked** until infrastructure and secure account access exist.

## Operations and remaining gates

Apply migrations explicitly and retain backups; roll back this additive foundation by removing its code/traffic first, never dropping a production database containing accounts/audit. Use a direct provider connection for migrations if transaction pooling disallows DDL. Retain auth/audit history; expired sessions/rate-limit rows need a separately scheduled retention policy before production scale. MFA, email verification/recovery, approved automated invitation delivery and fuller security operations remain bounded future/gated work.

Production dependency audit reports **zero advisories** at this check. PostCSS was patched to 8.5.30 for its source-map advisories; the unnecessary migration generator and its esbuild chain were removed after generating the initial schema. Full `npm audit` still reports **five inherited high lint-toolchain alerts**, all through the unpatched `braces ≤3.0.3` stack-exhaustion advisory ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); published latest braces remains 3.0.3. This toolchain consumes trusted repository globs, not app request data. Do not call the full dependency audit clean or downgrade Next/ESLint unsafely; track the upstream fix.

Manual screen-reader/voice/magnifier testing, hosted TLS/domain/DB/provider review, owner hands-on approval and the existing [public release checklist](../PUBLIC-SITE-STATUS.md#deferred-release-checklist) remain open. See [A01 review](reviews/01-foundation.md) for actual measured checks, screenshots, blockers and walkthrough.
