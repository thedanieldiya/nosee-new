# A05 — Review and verification

**15 October 2026 · Branch:** [`codex/admin-05-membership-emails`](https://github.com/thedanieldiya/nosee-new/tree/codex/admin-05-membership-emails), from latest main `28454dc` / A04 PR #20 (`fcab45d`). **Code ready for review; membership sending OFF and live acceptance pending.** [Migration, exact configuration, worker and backlog policy](../05-membership-emails.md).

A04 owner checks passed **except pagination**. Automated pagination coverage below does not complete that owner check. A10 real profile inventory/picker, Resend verification/config/live sending, unattended expiry and email schedules, final privacy wording and broader public-release/manual accessibility gates remain open.

## Measured verification

Node 24.19.0 / npm 11.9.0, Next 16.4.0 production build, disposable loopback PostgreSQL 17, Chromium and axe-core. All provider responses mocked; no real email, hosted DB connection/migration, account/DNS/Vercel/Neon setting or manual deploy. Local credentials are random/private temporary fixtures; no default account or user data committed.

| Check | Actual result |
| --- | --- |
| Existing public/unit | **130/130 passed** |
| Existing DB integration | **65/65 passed**: 32 authentication/invitation/access/audit; 17 application/consent/expiry; 16 Member/identity/authorization. A04 pagination now uses 45 records across three pages and active/interest filters (44 records) |
| Existing invitation Resend adapter | **12/12 passed**, unchanged template/token/expiry/redemption/reissue semantics; provider calls mocked |
| New template/config/provider tests | **8/8 passed**: explicit fail-closed enablement/fields, normalized activation and key rotation, all four HTML/plain-text subjects/content/escaping, safe URLs/no remote assets, explicit acceptance/rejection, bounded numeric/HTTP-date Retry-After, hard timeout even if mock ignores abort, conflicts/5xx/malformed/network uncertainty |
| New isolated outbox integration | **20/20 passed**: additive preservation/no backfill; atomic intent/decision/audit rollback; duplicates/concurrent decisions; no invalid/expiry/conversion emails; disabled/invalid/future config; held backlog/activation pause; applicant-recipient overlap; independent applicant/admin outcomes; stable key/body/hash; 429/global gate; increasing backoff/five-attempt bounds/sticky uncertainty; 23h cutoff/oversized delay; concurrent claims; interrupted recovery/token fencing; resumed expired-claim request denial; changed payload stop; failed acceptance persistence/recovery; safe summaries/audits and service/page/API/worker denial |
| New browser/HTML accessibility | **42 axe scans / zero violations; 240 icon/parent paint observations / zero mismatches; zero runtime errors.** All six notification states and all four templates at 390/768/1440px; no overflow, minimal authenticated link, keyboard navigation, normal/reduced motion. HTML rendered in Chromium, not certification of email-client rendering |
| A04 pagination browser | At **390/768/1440px**, 45 isolated records returned **20/20/5** across three pages, **zero duplicate IDs**. Active + climate-science filters returned **20/20/4** (44 records), filters retained, Previous/Next and keyboard activation verified. **Owner pagination verification still pending** |
| Existing browser workflows | **33 administrator scans / 222 icon colours; 27 application scans / 88 colours; 42 Member scans / 288 colours**, all zero violations/mismatches/runtime errors. Real invitation activation, permissions/sessions, JS/no-JS consent/submission, decisions, CRUD/conversion/association, keyboard/offline and role denial passed sequentially. **144 scans / 838 icon observations** including new A05 checks |
| Public regression | **18 screenshot pairs / zero changed pixels** against merged A04 homepage/About/Events/archive/detail/404 at 390/768/1440px; **27 HTTP route/302/HEAD/SSR404 checks passed**; seven public client manifests contain no admin, Radix, auth, DB or private email modules |
| CLI | Disabled invocation returns `enabled:false, processed:0, outcome:disabled`, exit **2**; no provider call |
| Typecheck / lint / production build | Passed; no dependency/lockfile change. No performance optimization or new CWV claim |

**235 automated Node cases** in total (130 + 65 + 12 + 8 + 20). Browser/a11y checks are additional. Bulk logs and masked screenshots remain outside Git; representative desktop/mobile notification and mobile receipt captures were inspected. No email body/addresses/secrets in audit or admin summary. Public change is restricted to truthful receipt wording; original public pages/assets/privacy remain unchanged.

During development, raw PostgreSQL clock output needed explicit Date decoding before Drizzle timestamp writes; this was fixed and the affected database suites passed. Browser selector ambiguity was fixed in the test. Final review removed a misleading paused label on completed messages and changed receipt/admin-alert wording to remain true if processing happens after review. These are new-email/UI semantics, with no source content corrections.

## Reproducing safely

Use **only** the guarded disposable loopback database named `nosee_admin01_test`, with mail/API credentials absent. Apply all reviewed migrations there, build/start with loopback `ADMIN_ORIGIN`, a random `MEMBERSHIP_EMAIL_WORKER_SECRET`, existing auth/expiry secrets and protected `NOSEE_ADMIN_FIXTURE_FILE` under `/tmp`. Never let an inherited hosted DB variable override the local fixture env. Tests refuse remote targets; the first existing integration suite resets its exact local DB. Run DB/browser mutations sequentially.

- Existing tests: `node --test tests/*.test.mjs`; `npm run test:mail`; existing auth/management, applications and Members suites. Expanded Members integration writes `members.json` with the pagination fixture prefix.
- `npm run test:membership-mail` creates only local synthetic identities/application fixtures. It temporarily enables config **in its test process only**, with `.invalid` recipients and an injected mock for every provider call. HTTP production app stays mail-disabled. Writes adjacent protected `mail-fixtures.json` for local QA.
- Browser `tests/check-membership-emails.cjs` arguments: loopback origin, protected `mail-fixtures.json`, protected `members.json`, `/tmp` output directory, axe script path. Templates render in memory. It changes only synthetic local notification states and never invokes a provider. The existing three browser suites remain reusable.
- After QA, stop owned local servers, remove disposable database/container and delete private env/credential fixtures. Do not seed hosted fake Lead scopes or publish passwords/screenshots/logs.

## Owner acceptance — five steps

1. On an authorized isolated Preview, review/apply additive migration `0004` through the established operator workflow. Sign in as Super Admin. Keep membership disabled; submit a synthetic `/join` application, approve/reject separate records, refresh each detail and verify held notifications plus a truthful public receipt. Normal Member/account behavior must remain unchanged.
2. As Super Admin, browse **more than 40 synthetic Members** across all three pages, use status/research filters, Next/Previous and mobile/keyboard navigation. Confirm persisted records do not disappear/repeat. This completes the separately pending A04 owner pagination check only after you confirm it.
3. With an authorized existing Editor (and genuine scoped Lead if available), try application detail and notification API: expect denial; anonymous requests require sign-in/API401. Check Activity log for System/status/record metadata without addresses, bodies or private notes. No new Email Delivery menu or unsafe retry button exists.
4. **Only after separate explicit live-test approval**, verify Resend sender/domain, approve every notification recipient and isolated applicant inbox, configure private variables and a new future cutover as documented. Submit after cutover, run the authorized worker repeatedly, and receive/check receipt + admin alert + approval + rejection HTML/text. Check no review note/answers leak and approval claims no Member/account creation. Compare provider acceptance separately from actual inbox receipt; held/historical records must stay held.
5. After inbox/content acceptance, separately authorize/verify the chosen worker cadence, failed-invocation monitoring and expiry schedule. Review stopped uncertainty before any separately approved replay. Replace/approve privacy wording and complete manual AT/release checks independently; neither activation nor this task approves public launch.

## Preview and unresolved gates

**Preview blocked/unverified:** read-only GitHub deployment lookup returned HTTPS CONNECT **403**. No actual branch URL can be verified; none guessed. The owner must supply the real protected branch preview and arrange its isolated migrated Preview DB, exact HTTPS origin and secure existing role access through the approved workflow. Push uses the existing Git/Vercel integration; no manual deploy/settings change here.

Not operational/accepted yet: **Resend sender/domain/configuration, approved recipients and isolated inbox tests of all four messages, actual inbox/email-client review, hosted worker/scheduler execution and owner acceptance**. Invitations' live acceptance stays separate. Disabled/held events cannot be replayed by the normal worker; any backlog tool requires separate approval and uncertainty reconciliation. A04 owner pagination, A10 real profiles, expiry scheduling, final privacy and public-release gates are explicitly retained. No PR, merge or A06 work.
