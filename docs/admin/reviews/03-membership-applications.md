# A03 — Review and verification

**Historical implementation review:** A03–A05 results below describe those original milestones. **A05 merged in PR #21 (`174620b`).** The owner's [A05.5 correction](../05-5-membership-workflow.md) supersedes separate conversion/manual match controls and approval email wording for new events. Follow its current walkthrough; A04 owner pagination and live email acceptance remain pending.

**Owner update, 15 October 2026:** PR #19 merged (`27baf80`, main merge `4da6d4a`) and the owner confirms A03 manual browser checks passed. Unattended expiry scheduling, final privacy wording and Resend live setup remain open. The following is the historical implementation handoff, not a claim those operational gates passed.

**15 October 2026 · Branch:** [`codex/admin-03-membership-applications`](https://github.com/thedanieldiya/nosee-new/tree/codex/admin-03-membership-applications), from main `bf0d72e`. Implementation contract, consent versions, limits, migration and worker setup: [A03](../03-membership-applications.md). Owner review pending; no PR, merge, manual deploy, hosted DB migration, provider operation or external setting change.

## Actual checks

Node 24.19.0 / npm 11.9.0, Next 16.4.0 production builds, isolated official PostgreSQL 17 container bound to loopback, Chromium and axe-core. Random role credentials live only in mode-0600 temporary files, never source/logs/screenshots. All database tests guard the disposable loopback `nosee_admin01_test` database. No owner's Neon connection is used.

| Check | Observed result |
| --- | --- |
| Existing public/unit tests plus three new input/catalog cases | **126/126 passed**: exact choice labels/order, all required fields, explicit consent, limits/enums/unique interests, decision/query allowlists |
| Existing auth/administrator integration | **32/32 passed** on A03 schema: original sessions/auth/bootstrap, invitation lifecycle, mocked Resend, authorization, access-version revocation, audit rollback and pagination |
| Mocked Resend adapter regression | **12/12 passed**; no provider request sent |
| A03 PostgreSQL + real HTTP | **17/17 passed**: additive preservation, consent timestamps/versions, no identities/sessions, token boundary/tampering, origin/honeypot/mass assignment, duplicate/email concurrency/idempotency/rates, role/page/API/service denial, private decisions/reviewer, conflicting decisions, 720-hour deadline and lock-wait expiry race, final-state preservation, separate reapplications, safe System audit and transaction rollback, search/pagination, 1,001-record bounded sweep/backlog/effective expiry, authorized worker without a dashboard |
| New browser workflows | **27 axe scans / zero violations; 88 computed icon/parent paint observations / zero mismatches; zero runtime errors**. 390/768/1440px initial/error/receipt/privacy states; keyboard focus/error summary, affirmative consent, persisted multiple interests, no session creation; native no-JS server validation/submission; Super Admin list/empty/detail/confirm/Escape/focus return/approve/reject; expired/final controls disabled; offline review remains pending with honest error; Editor/Lead direct 403 |
| Existing management browser regression | **33 axe scans / zero violations; 222 icon/label paint observations / zero mismatches; five workflow records, zero runtime errors**. Existing directory/activity/filter/mobile-navigation/role-change/deactivate/reactivate/offline/activation and real Editor sign-in checks passed; sequential shared-DB fixtures |
| Public visual regression | **18 pairs, zero changed pixels** against the unchanged main production artifact (same tree as merged Resend): homepage/About/Events/archive/detail/404 at 390/768/1440px; identical reduced motion, fonts and decoded images |
| Public HTTP | Existing **25** event/meeting/302/HEAD/query/404 checks passed; no original public route/content changes |
| Fail-closed production process | No DB/auth/worker configuration: `/join` disables submission, worker returns **503**, existing homepage returns **200**. Configured worker rejects missing/wrong bearer, including a Super Admin cookie; CLI returns real counts with no PII |
| Public dependency boundary | Six sampled public client-reference manifests, including Join/Privacy, exclude admin components, Radix, Better Auth and database imports. Join client imports pure choices plus a server-action reference; no new dependency/lockfile change |
| Typecheck / lint / production build | Passed on final application code. No Lighthouse optimization or new CWV claim |

Reusable checks: `tests/membership.test.mjs`, `tests/membership-integration.mjs` (`npm run test:membership`) and `tests/check-membership.cjs`. Browser invocation takes loopback origin, private fixture path, `/tmp/…` output directory and axe script path, using the same explicitly isolated environment. Run mutating DB/browser suites sequentially. Generated screenshots/logs/results stay outside Git; three masked representative captures were inspected locally. No migration evidence archive is introduced.

## Owner browser acceptance (five steps)

1. On the authorized isolated branch preview, open `/join` signed out. Verify exact options, multiple interests and the unchecked required consent; inspect the clearly labelled `/privacy` placeholder. Submit **test information only**. Expect “Application received”, no email claim, no dashboard login. Repeat once without JavaScript and once with no interest selected to see server validation.
2. Sign in as the existing Super Admin and open `/admin/membership/applications`. Search/filter the test application and review its read-only answers, UTC deadline and recorded consent version/time. Check mobile/desktop wrapping and keyboard focus.
3. Cancel an Approve/Reject confirmation using Escape and verify focus returns. Enter a private reason and confirm a decision; refresh to see reviewer/time/note and disabled final actions. Activity log should contain generic target/status changes, no answers/email/reason. Approval creates no Member/account. Use a separate test application to test rejection and a fresh reapplication.
4. Sign in as an authorized test Editor (and an existing genuine scoped Lead if available); direct list/detail/API access must return denial, with no Membership sidebar link. Anonymous private access must request sign-in or return API 401. Do not invent a Lead group to enable this walkthrough.
5. For expiry, an authorized operator may prepare an overdue **isolated test** record or wait for its real 720-hour deadline, then invoke the documented CLI/bearer worker **without opening the dashboard**. Verify `expired`, retained answers, one System expiry audit and denied decisions; repeat the sweep to confirm no duplicate audit. Activate and observe a schedule separately before claiming unattended persistence.

## Open gates

**Preview blocked/unverified:** GitHub deployment-status lookup again returned HTTPS CONNECT **403**. No actual branch-specific hosted URL is verified, guessed or substituted with the main deployment. Owner must authorize/configure the isolated Preview DB/migration/origin, secure role access and provide the actual URL or allowed read-only deployment access. Local screenshots/automated interactions do not count as owner hosted acceptance.

Approved privacy/legal/retention wording, real unattended sweep scheduling and manual screen-reader/voice/magnifier checks remain open. Resend **PR #18 / `1204b06` is merged**, but DNS/domain verification, live credentials/configuration, approved-inbox sending and owner administrator-invitation acceptance remain pending. A04 member records/identity linking and A05 membership emails are deliberately absent. Public noindex and existing release gates remain; there is no claim of public launch, legal compliance, actual email delivery or production readiness.
