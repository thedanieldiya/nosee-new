# A05.5 — Correction review

**15 October 2026 · In review.** Branch [`codex/admin-05-5-membership-workflow`](https://github.com/thedanieldiya/nosee-new/tree/codex/admin-05-5-membership-workflow), implementation **`0b60034`**, pushed from main `a17d9e4` (A05 PR #21 / head `174620b`). [Current contract, migration and five-step owner walkthrough](../05-5-membership-workflow.md). **Correction milestone within the existing 13-task plan; not another numbered task.**

The owner supersedes separate conversion with automatic Active membership on approval, explicit existing-member/reactivation acknowledgement, automatic match checks and in-place privacy review. Historical descriptions in A03–A05 reviews are marked superseded. A04 owner pagination, A10 real profiles, email live setup/acceptance, email/expiry scheduling, final privacy wording and manual AT/public-release gates remain open.

## Measured results

Node 24.19.0 / npm 11.9.0, Next 16.4.0 production build, owned disposable loopback PostgreSQL 17, Chromium/axe. Synthetic accounts/data only; fixtures private outside Git. All enabled provider requests mocked, no real email, owner database connection, live migration, provider/DNS/Vercel/scheduler change or deployment.

| Check | Actual result |
| --- | --- |
| Public/unit | **135/135 passed**, including five new acknowledgement/query/template cases. Independent hash captured from merged A05 verifies byte-identical v1 approval output; v2 truthful content and invalid-version rejection |
| Existing database suites | **85/85 passed**: 32 auth/invitations/access/audit, 17 applications/expiry, 16 Members/identity and 20 durable mail. Expectations updated only where the owner changed the workflow; historical fixtures explicitly model unassociated old approvals |
| New workflow integration | **13/13 passed**: automatic source/Active/date/association/v2 intent with no auth/public side effects; repeated/racing approval; Member/association/approval-audit/outbox rollback; explicit matching acknowledgement; disclosed reactivation/profile/date preservation and rollback; stale/changed/new match; namesakes/manual-add race; expiry/lock waits; historical reconciliation/original UTC date/no duplicate mail; preserved v1 migration/retry/hash/key; role/version/origin denial |
| Existing provider mocks | **20/20 passed** (12 invitation + eight configuration/template/provider cases); no transport/invitation behavior change |
| New responsive browser | **29 axe scans / zero violations; 136 icon/text observations / zero mismatches; zero runtime errors.** 390/768/1440px privacy/consent/value/focus/background/scroll lock, Escape/Close, disabled fieldset, independent privacy page; debounce/minimum input/private POST, late cancelled response ignored, lookup failure honest, edit excludes self. Mobile new/existing/Inactive/historical confirmations establish one association; no separate conversion. Native no-JS privacy link retained |
| Existing browser regressions | **33 administrator + 27 application + 42 Member + 45 notification/template axe scans**, all zero violations/runtime errors; **838 icon/text observations**, zero mismatches. Includes invitation activation/access changes, native no-JS submission/consent, Member CRUD/identity links/historical reconciliation, all six notification states and v1/v2 approval templates at three widths. **176 scans / 974 icon observations total** with the new workflow suite |
| Existing public visuals | **18 full-page pairs / zero changed pixels** against merged A05 at 390/768/1440 (home/About/Events/archive/detail/404) |
| Authorized public flow comparison | **Six source/target pairs**: three closed Join full pages **zero changed pixels**; three Privacy unchanged article regions **zero changed pixels**. Full captures show the approved removal of the return link and resulting footer displacement. Newly opened native privacy panel reviewed separately; additional 320px short-screen scroll/reflow/Escape/focus-return assertions passed |
| HTTP and dependency boundary | **27 existing route/302/HEAD/SSR404 checks passed**; public manifests inspected for admin/Radix/auth/DB/private service leakage |
| Typecheck / lint / build | Passed, no warnings on final checks. No new dependency/lockfile, global token/style or public performance optimization. No new CWV claim |

Final production-build HTTP approval smoke also passed: authenticated 200, associated Active member, matching UTC decision/join date, blank notes and one held v2 approval job. Implementation local/remote heads matched via `git ls-remote`; no hosted deployment claim.

**253 Node cases** in total (135 + 85 + 13 + 20); browser checks are additional. Full QA logs, source/target matrices and random credentials remain temporary outside Git. Representative masked dialog/member/email captures were inspected. No generated evidence archive or real private data is committed. Automated axe and keyboard checks do not certify screen-reader/voice/magnifier or email-client conformance.

Browser verification found native Tab leaving a one-control dialog for browser chrome; explicit first/last wrapping now keeps focus inside while Escape remains native. The dialog portal avoids a disabled-fieldset Close defect. Stale-response handling is exercised with a deliberately delayed intercepted request. Initial selectors were corrected for name suggestions; an image capture made while build assets were being refreshed was discarded and repeated against the stable production build. Final review retained A03’s single materialized database instant for expiry eligibility, decision time and derived join date; all **66 affected membership integration cases** passed again after that correction. No failing/unexecuted check is counted as passing.

## Reproduction and owner setup

Use only the guarded loopback `nosee_admin01_test` database with synthetic fixtures and mail absent/off. Apply migrations locally, build/start at the configured loopback origin, and run shared-DB suites/browser checks sequentially. Existing architecture instructions protect env/role fixtures under `/tmp`; never run destructive suites against Neon/hosted Preview/production.

- `node --test tests/*.test.mjs`, `npm run test:mail`, existing admin/application/member/mail integration, `npm run test:membership-workflow`, typecheck/lint/build.
- New integration writes protected `workflow-fixtures.json`. `tests/check-membership-workflow.cjs` takes loopback origin, that private file, `/tmp` output and axe script. `tests/check-membership-visuals.cjs` takes loopback source/target origins and `/tmp` output. Existing Member tests cover 45 records, three pages and filters; **owner pagination still pending**.
- **Migration `0005` is required before new approval**: expand only the version constraint, no record rewriting/backfill. Review/apply on the owner-authorized isolated Preview through the explicit operator workflow. Without it, approval safely rolls back when recording v2 intent. No new env variable, member migration, account provisioning or mail enablement required for disabled review.
- Existing v1 jobs remain v1 with stable bodies/hashes/keys/attempts; all new approvals use v2, other events v1. No held backlog promotion/replay or new approval job on historical reconciliation. Sending remains OFF; approved sender/recipients, isolated inbox tests, worker/expiry schedules and final privacy remain pending.

**Preview blocked/unverified:** read-only deployment API returned HTTPS CONNECT **403**. No actual branch URL is verified or guessed. Owner must provide the protected branch deployment and arrange isolated migrated Preview DB, exact origin and secure existing role access. Git push uses the existing integration; no manual deploy or external settings changes.

Use the [five practical acceptance steps](../05-5-membership-workflow.md#verification-and-owner-walkthrough) for automatic approval, existing/Inactive/stale identities, Add/Edit matching, privacy values/focus/no-JS and role denial. A05 live/email-client acceptance remains separate; no approval of launch is implied. No PR, merge or A06 work.
