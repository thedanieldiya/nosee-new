# Admin Dashboard 02 — Administrator management and Activity log

**Status:** Proposed implementation handoff; owner review of the invitation-delivery and Research Group Lead deferral below is required before coding. **Canonical scope:** [Admin Dashboard TRD v1.2](../admin-dashboard-trd.md), [Admin Tracker](TRACKER.md), and the security/data foundations in [Admin 01](01-foundation.md) and [architecture](architecture.md).

**Repository:** `thedanieldiya/nosee-new`, work from the latest `main` after the Codespace `package-lock.json` repair is reviewed and merged. Node 24 / Next 16.4 / React 19.3 / Drizzle / Better Auth. Work on a single task branch `codex/admin-02-administrators-activity`; commit and push for owner review. **Do not create a PR, merge, deploy, change Vercel/Neon environment variables, purchase/connect services or modify production data without separate owner approval.**

## 1. Scope and user-visible result

Implement **working**, Super-Admin-only:

- `/admin/settings/administrators` — administrator directory with search/filter and sensible pagination, role and account/invitation status, creation/invitation date and last-login date (read-only), invitation controls, role changes, activation/deactivation and scope assignments where valid. Expose first/last name, email and the approved roles: Super Admin, Editor, Research Group Lead. Make pending, active, revoked, expired and deactivated states truthful. Show useful empty, loading and error states. Confirmation for consequential actions.
- `/admin/settings/activity-log` — read-only, genuinely persisted activity with timestamp, actor, action, affected record and a redacted before/after summary **only when captured**. Filters for date range, actor, action and target. Server-side pagination. Preserve and display pre-existing bootstrap/sign-in/profile/password activity gracefully, without fabricated targets or summaries.

Unfinished modules remain marked unavailable; no Membership, Research editor, CMS, applicant database, global email page or account-configuration overhaul.

## 2. Secure invitation/onboarding proposal (no mail provider yet)

- A Super Admin enters first name, last name, email and role. The application creates a **pending invitation**, not a login-capable active account. The Super Admin can copy a cryptographically random **one-time invitation code**, shown only at creation/regeneration, and privately send that code with the activation page URL to the invitee. **No automated invitation emails are sent or claimed**; provider-mediated delivery is a separate owner-approved integration.
- A token-gated activation page lets the invitee supply the invitation code and set/confirm a unique password (existing 15–128-character rule). The invitee **cannot select or modify role, email, group scope or activation status**. Account creation and token consumption happen atomically. On completion, send the person to the existing admin sign-in page, not a new public signup.
- Generate codes using cryptographic randomness; store **only a hash**, never the raw code; 48-hour expiry; single-use, rate-limited verification; allow Super Admin to revoke or regenerate and thereby invalidate previous codes. Avoid codes in query strings, URLs, application logs, audit payloads, analytics or errors. Use the normal server-side CSRF/origin protections; send invitation codes as private POST form data. Never hardcode credentials or reveal accepted hashes.
- Enforce normalized case-insensitive unique administrator emails; fail safely when inviting an existing/pending/deactivated address. Account and invitation errors must not leak credentials, internal SQL or token state to anonymous users. Invitation possession alone is **not** email-address verification; don't mark an email verified without verification.
- Preserve A01's `disableSignUp`, vetted Better Auth password hashing, sessions, role authorization and password controls; no alternative public registration route.

**Owner decision before implementation:** This proposes private, manually shared one-time codes because no email provider has been approved. A secure delivery integration may be added later; do not silently assume email works.

## 3. Roles, scope and lifecycle

- **Super Admin only:** create/revoke/regenerate invitations, read directory and activity, modify roles and allowed group assignments, activate/deactivate administrator access. Editor and Research Group Lead cannot view these pages or hit their server actions/API routes, even with crafted URLs/requests.
- Roles/scope are assigned and changed server-side only. Re-read the acting user's authority for every mutation. Invalid role values, extra fields, arbitrary group IDs and unauthorized access must fail closed. `research_group_lead` may have **exactly one real assigned group**, with strict group-specific access; the database constraint already forbids an unscoped active lead.
- **Dependency:** The research-group CRUD/authoritative group records are planned for A06. Until real groups exist, **display Research Group Lead as unavailable for new invitations or role assignments, with a truthful explanation**, rather than inventing group IDs or creating research-group management inside A02. Preserve existing A01 role/scope guards and add integration tests with isolated test-only group IDs. Finish the owner's live scoped-Lead review after real groups can be provisioned (A06), unless the owner separately approves an earlier scoped identity source.
- An administrator's own self-deactivation/demotion should be blocked. Never deactivate/demote the **last active Super Admin** or strand the organisation without an active privileged operator; enforce these invariants transactionally under concurrent requests.
- On deactivation, revoke all existing sessions immediately; prohibit new sign-ins. On role reduction/scope change, revoke sessions or reliably enforce updated privileges on every protected read/write; test both. Re-enabling a person must not bypass authentication or revive previously revoked sessions. Prefer reversible deactivation over hard deletion.

## 4. Audit and data design

- Extend Drizzle schema and the checked-in SQL migration with the **minimal** invitation records and structured, nullable audit target/summary metadata needed for the new screens. Preserve all A01 rows and the permanent initial-Super-Admin audit marker; no destructive reset or default account seeding.
- Record successful invite creation, revocation/regeneration, acceptance, role/scope changes and deactivation/reactivation with actual actor/time/target and safe before/after states in the same transaction as each state change. Retain the existing login, own-profile and password-change events. No plaintext passwords, invitation codes, hashes, session cookies, request authorization headers or secret values in audit data.
- Keep authentication and PII entirely server-side. Add authorization checks at page + action/API/data layer, parameterized database access, input validation, safe logging, `no-store` responses where needed and bounded/paginated reads.

## 5. UI and testing contract

- Use existing shadcn-inspired NOSEE admin primitives, green tokens, fonts, and **MingCute only** for general-purpose icons with computed text/icon colour parity. Desktop/mobile directory tables and forms must work at 390/768/1440px, keyboard-only, with appropriate semantics, focus management and confirmation/error states. No fake counts, status, mail success or Save actions.
- Run clean `npm ci`, unit/security and real isolated PostgreSQL integration tests, typecheck, lint, production build and public-page regression tests. Never execute destructive integration tests against the owner's `nosee-db`. Confirm the migration is incremental and safe to apply to the deployed development database after separate owner approval.
- Exercise expired/reused/revoked/concurrently redeemed codes; roles and invalid group scope; direct-URL/API authorization; self/last-Super-Admin safeguards; session revocation; audit atomicity and safe redaction; duplicate email; invalid/untrusted origin, CSRF, rate limits and enumeration resistance. No new public/client bundle leakage of admin code or credentials.
- Push branch with the code, migrations, small QA evidence, exact limitations and a 3–6-step owner browser walkthrough. Provide only a **verified** preview URL if accessible. The owner chose a non-launch, production-labelled Vercel deployment from `main`; do not mistake the Production label for permission to deploy, access production secrets or invite real organisational users. If Preview is not configured, report it as blocked and let the owner review/test after a separately approved merge to the development-only main deployment.
- Update [TRACKER](TRACKER.md) with truthful branch/commit, tests, blockers and review outcome. **No automatic PR or merge.**

## 6. Owner acceptance walkthrough after a safe deployment

1. Sign in as Super Admin; view the Administrators directory and own existing account. Confirm role, status, and actual last login; no fabricated records.
2. Create an **Editor** invitation; securely copy/deliver the one-time code; accept from a separate private/incognito browser, choose a password, and sign in. Confirm pending → active and invalidation of a reused code. No claim of email delivery.
3. In the Editor session, confirm only the approved navigation and access; direct requests to `/admin/settings/administrators` and `/admin/settings/activity-log` and their APIs must be denied.
4. As Super Admin, change that test Editor's role/permissions or deactivate the account; verify the old Editor session loses access, deactivated login fails, and the final active Super Admin cannot be revoked/demoted.
5. View Activity log and filter real invite, acceptance, role/deactivation, sign-in and profile actions; actor/time/target accurate, secrets absent. Verify mobile layout and keyboard interactions.
6. Confirm Research Group Lead selection is transparently unavailable until an authoritative group exists, unless an owner-approved earlier group source is implemented. No random UUID scope.

**Remaining A01 acceptance:** Super Admin owner browser journey passed 6/6 on 15 October 2026; Editor and Research Group Lead hosted owner-role checks are still outstanding. Editor can be reviewed after A02. Lead awaits a real group scope (currently A06).

**Not in A02:** real email provider/delivery, public membership `/join` (A03), organisation members (A04), membership transactional emails (A05), research-group CRUD/content (A06), publication/website editors (A07–A12), final full-system acceptance (A13).
