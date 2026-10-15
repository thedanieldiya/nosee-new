# Admin Dashboard 02 — Administrators, automated invitations and Activity log

**Subsequent A06 scope update:** [Research groups](06-research-groups.md) now prepares real Member/group-bound Lead assignment/invitations, lifting A02's deferral through that contextual workflow only. Generic unscoped role changes remain disallowed; live provider/inbox acceptance remains pending.


**Decision status (15 October 2026):** Owner approved **automated emailed administrator invitations**, subject to **a separate, explicit email-provider approval before integration, connection or sending**. The owner also approved deferring new Research Group Lead invitations/assignments until A06 creates real Research groups. This document supersedes the earlier manual-code-delivery proposal. The email template direction is Swiss-inspired and concise. **Provider choice, sending domain/address, credentials and paid resources are NOT approved yet.**

**Later owner direction (15 October 2026):** Resend adapter **code preparation is now explicitly authorized**; follow [Resend setup/status](resend-invitations.md). This supersedes the provider-code gate only. Account connection, sender/domain/DNS, Vercel configuration, live migrations and real sending remain unauthorized/pending.

**Source of truth:** [Admin Dashboard TRD v1.2](../admin-dashboard-trd.md), [TRACKER](TRACKER.md), [A01 architecture](architecture.md), [A01 evidence](reviews/01-foundation.md). [PR #16](https://github.com/thedanieldiya/nosee-new/pull/16) merged the npm lockfile repair. A01 Super Admin browser checks (six core tasks, plus password change/rejected old password) passed; Editor and scoped Lead owner walkthroughs remain pending.

**Repository:** `thedanieldiya/nosee-new`. Use **latest `main`**, Node 24, Next 16.4, React 19.3, Better Auth + Drizzle + PostgreSQL; one task branch `codex/admin-02-administrators-activity`. Commit and push only. **Do not create a PR, merge, deploy, modify live Neon/Vercel data/secrets/settings, purchase or connect a provider, or send real email without separate owner approval.** This is the existing **prelaunch** Vercel `main` deployment, despite Vercel labelling the environment “Production.”

## 0. Provider-approval gate — mandatory before sending integration

1. **First investigate** 1 recommended transactional email provider and 1 credible alternative compatible with Next.js/Vercel, for example Resend and Postmark (examples only, not selections). Verify from current official documentation: free/paid tiers, sending-region fit if relevant, sender-domain verification, API-based sending, SPF/DKIM/DMARC setup, send status/error reporting, rates, operational limits and secure key provisioning. Provide a concise recommendation with source links and any prerequisites. Do not invent pricing or claim deliverability guarantees.
2. **Stop and request explicit owner approval** for the particular provider, any account/plan/cost, sending domain and `From` address, expected recipient-testing method, and credentials configuration. Do not assume an account exists or that a provider is already installed. Email-service approvals apply only to **A02 administrator invitation emails**, not to A05 membership notifications or marketing.
3. **Permitted before provider approval:** implement provider-independent administrator directory, access lifecycle, audit log, invitation schema, the isolated secure activation flow, responsive email-template rendering and tests using a **strictly test-only** fake sender. Define a small mail transport interface/config validation with no provider-specific SDK/secret. If working on these while waiting for approval, explicitly mark real invitation delivery **blocked**, not ready.
4. **Forbidden before provider approval:** installing or integrating a specific email provider, setting or reading real provider secrets, connecting accounts, touching DNS, enabling live sending or claiming an invite has been emailed. Once a provider is approved, implement and test its adapter on a task branch; owner separately controls Vercel env/DNS/deployment.
5. No automatic or manual **copy-and-share invitation-code fallback** in the deployed administrator UI. The approved user-facing workflow is automated email. If email is unconfigured, the Invite action must be disabled or fail closed with a clear “Email invitations are not configured” explanation; no invite can appear as sent.

**Delivery gate:** A02 can have usable directory and Activity log functionality before provider approval, but **invite-by-email is not accepted as complete** until a selected, approved provider successfully sends to an owner-approved isolated test inbox and the invite can actually be redeemed. Report this honestly.

## 1. Pages and interactions

- `/admin/settings/administrators` — Super-Admin-only directory with meaningful search/filter and bounded pagination; first/last names, email, access role, active/deactivated account state, invitation state, date invited/created, last login (read-only), contextual actions. Real create/email invite, resend/revoke pending invite, change eligible role, activate/deactivate accounts. Confirmation on consequential actions; genuine empty/loading/error states; clear distinction between “sending”, “accepted by provider”, “failed”, “pending acceptance”, “expired”, “revoked” and “active”. The provider accepting a message is **not proof of inbox delivery**.
- `/admin/settings/activity-log` — Super-Admin-only, **read-only** list of real audit entries with actor, time, action, target and safe before/after data only when actually captured; filter by date range, actor, action and target, with server pagination. Existing A01 events must still appear without invented target/detail data.
- `/admin/accept-invitation` (or minimum approved equivalent within the existing admin sign-in shell) — narrowly scoped anonymous invitation acceptance, **not public account registration**. Invitee enters the emailed one-time code and chooses/confirms a password; on successful activation, send them to existing `/admin/sign-in`. Confirm no protected page/layout incorrectly intercepts the activation route.

Do not add Membership, Research group editor, Publishing, CMS, public `/join`, Operations, generic email/settings page, or membership-mail workflow.

## 2. Secure invitation and account lifecycle

- Super Admin enters first name, last name, email and an eligible role. New invitations target **Super Admin or Editor only during A02**; show Research Group Lead in the approved role vocabulary but **disable it with a clear explanation until A06**. Do not create dummy groups, accept arbitrary group UUIDs or invent group dropdown options.
- Persist a **pending invitation** separately from `administrator` and `admin_account`; a pending invitation never grants login access. Prevent duplicate active/pending invites for the same normalized email and resolve existing/deactivated identities via an explicit safe action. Do not silently overwrite the original account.
- Generate a cryptographically secure, high-entropy one-time code (at least 128 bits, preferably 256); persist **only a one-way digest** of it. Expire after **48 hours**. Single-use redemption, revocation, resend/regeneration (rotating the previous code), bounded verification attempts, rate limits and transaction-safe concurrent acceptance. Do not expose codes, hashes, credentials or provider keys to logs, audits, analytics, query strings, URL paths, PRs or screenshots.
- Email includes a token-free activation page URL and a copyable one-time code. The code is submitted to a protected server-side **POST** action; do not put it in URLs. The invitee cannot change email, role, account state or group scope; setting a password (existing 15–128 character rule) and creating the identity happen atomically, with Better Auth's existing password hashing. Preserve `disableSignUp`; do not allow generic public signup, arbitrary password reset, or role escalation. The invitation alone does **not** mark emailVerified true.
- **Delivery states must be accurate and recoverable:** create a pending send record; attempt provider send only after the approved adapter is configured; persist provider acceptance metadata/status (not the invitation code). If sending definitively fails, mark failed and revoke that token; an explicit resend must rotate the secret. If provider acceptance is unknown, show “delivery unconfirmed” and offer safe recovery rather than claiming success. Do not store plaintext resendable tokens for later retries; avoid an unencrypted mail-outbox payload. Never expose an active invitation token in a response to the Super Admin.
- Real account creation upon successful redemption; apply the approved role on the server; invitee sets the password and signs in with the existing auth flow. Accurate audit entry for invite issuer, subsequent send attempts, revocation, acceptance and activation. Separate provisioning from member/applicant approval.

## 3. Role management, authorization, safeguards

- All administrator directory and Activity log pages, list queries, mutations, resend actions and access checks require server-side `super_admin` authorization. Editor and Lead are denied even through direct URL, action or API requests.
- Apply role and active-state permissions server-side; validate input with strict allowlists and normalized email. Forbid self-demotion/deactivation and the removal or demotion of the **last active Super Admin** (including concurrent requests), protecting the initial bootstrap marker. Prefer reversible deactivation to hard deletion.
- On deactivation, revoke existing sessions immediately and block further sign-in. On role or scope changes, revoke sessions or enforce up-to-date authorization on every request and verify with tests. Never resurrect old sessions on reactivation. Preserve current authorization and account-security behavior.
- A06 owns creation and assignment of real Research groups. In A02, existing A01 server-side Lead-scope checks remain intact; create **no unscoped Lead**. Live Lead owner acceptance stays pending until valid group data is available.

## 4. Email design and copy — approved design direction

**Design:** Swiss/International Typographic Style principles: deliberate alignment and hierarchy, legible type, restrained spacing, grid-informed single column, no ornamental cards, gradients, decorative glyphs, marketing imagery or disconnected phrase fragments. 560–600px max reading width; white background, dark body text (`#171717`) and subtle dividers; NOSEE brand green **`#13853D`** as the primary accent for the button/line and little else. Left align text, consistent spacing, clear subject, headline, paragraph and one primary CTA.

Use the project's **Ubuntu Sans** for headings and **IBM Plex Sans** for body where supported, with robust Arial/system fallbacks (webfonts are unreliable in email clients). Build responsive, accessible **HTML email and equivalent plain-text email**, using email-client-safe tables and inline CSS, meaningful contrast, touch-friendly CTA, clear visible destination, no tracking pixel or sensitive URL parameters, and correct escaping of dynamic names/role/code. Preview in at least common Gmail/Outlook/mobile clients where possible. Do not load admin JS/CSS into emails.

**Approved invitation template baseline (refine only for grammar, accessibility and actual renderer constraints):**

- Subject: **Invitation to NOSEE Administration**
- Brand line: **NOSEE**
- Heading: **You're invited to NOSEE**
- Paragraph: **Hello {firstName},**
- Main text: **{inviterName} has invited you to the NOSEE administration workspace as {roleLabel}. To activate your account, open the setup page and enter the invitation code below, then create your password.**
- Primary CTA: **Set up your account** (links to a token-free secure `/admin/accept-invitation` URL).
- Code section: **Your invitation code** followed by the generated one-time code, with clear copy-friendly text styling.
- Footer: **This invitation expires in 48 hours. If you weren't expecting it, you can ignore this email.**

Use natural complete sentences, no overexplaining or “random” stacked slogans. A reissued invitation may use the same template with truthful expiry/code details. Keep sender/subject/branding consistent after provider approval. Future A05 emails may reuse this **visual foundation**, but A05 sending/content is out of scope.

## 5. Data, QA and deployment boundaries

- Add minimal **additive** Drizzle migrations for invitation, send-status metadata and structured/redacted audit target/summary fields; preserve A01 data, schema and permanent bootstrap audit marker. Capture actor/time/target in the same transaction as role/account mutations where applicable. Enforce referential integrity, uniqueness and least privilege. No destructive schema reset or production fixture writes.
- Tests: valid and invalid invite/token paths, expiry/reuse/revocation, concurrent redemption, resend replacement, duplicate emails, missing-provider fail closed, mock-provider success/failure/uncertainty, sender formatting/escaping, no code/log leakage, role/scope rejection, direct URL/API authorization, last-Super-Admin concurrency safeguard, deactivation/session revocation, audit atomicity/privacy, invalid origin/CSRF/rate limits and prelaunch public regression. Never send to real colleagues or run destructive tests against owner `nosee-db`.
- Check clean `npm ci` (lockfile repaired by PR #16), tests/unit/security, isolated real PostgreSQL integration, typecheck, lint, production build, responsive/keyboard/accessibility checks at 390/768/1440px, MingCute-only icon import and text/icon color parity. Existing public website must remain visually/behaviorally unchanged.
- Build on a single task branch; push changes, exact migration list, provider proposal/approval **blocker**, tests, concise QA evidence and 3–6-step owner walkthrough. A Vercel Preview URL may be reported **only if actually verified**. The owner's Vercel `main` is prelaunch but **Production-labelled**, not permission for an unapproved production deployment. No automatic PR, merge, deploy, provider connection, environment secret access or email delivery. Update [TRACKER](TRACKER.md) truthfully.

## 6. Owner review and acceptance — after provider approval and safe deployment

1. Sign in as Super Admin; directory shows the actual Super Admin account with correct role/state and last login.
2. With **owner-approved provider and isolated inbox**, invite a test Editor; verify a readable HTML/plaintext email actually arrives, sender details are correct, the link contains **no secret**, the one-time code is usable, and status reflects provider acceptance rather than assumed inbox delivery.
3. Activate from a separate browser, set a password and sign in as Editor; verify only approved Editor sidebar pages appear, and direct Administrator/Activity pages and APIs deny access. Used, expired and revoked codes must fail.
4. As Super Admin, deactivate/reactivate or change a test Editor's role; previous access is revoked; attempts to lock out the last active Super Admin are blocked. Confirm resend rotates invitation code; failed delivery is never described as sent.
5. Review Activity log with date/actor/action/target filters; verify recorded actors, times, target and safe details, no secrets. Verify keyboard and mobile behavior.
6. Confirm Research Group Lead is explicitly unavailable for new invitations until A06, without any dummy or unscoped group assignment.

**A01 residual acceptance:** owner passed six Super Admin browser checks **and** password change with rejection of old password (15 October 2026). Editor can be owner-tested as part of A02 once automated invitation sending is approved; scoped Lead remains for A06.

**Not A02:** Membership `/join` (A03), private member records (A04), membership transactional email (A05), research groups (A06), CMS/editor work (A07–A12), cross-module acceptance (A13). No fake “sent” badges, fake inbox, manual sharing workaround, unapproved provider or secret disclosure.
