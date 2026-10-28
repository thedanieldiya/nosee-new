# A12 — Privacy policy and reserved Monitoring

**28 October 2026 · Production candidate, in review.** `codex/a12-privacy-monitoring` starts from main `9ae00c6`, containing merged [A11 PR #34](https://github.com/thedanieldiya/nosee-new/pull/34). **11/13 core milestones are merged.** A11 owner walkthroughs, Gallery layout approval and hosted durable-storage acceptance remain pending; A12 is separate review work.

## Editor and policy lifecycle

Website → Site content → Privacy policy is `/admin/website/site-content/privacy`. Super Admin and Editor have access; current server authority/access-version checks deny Leads and anonymous callers. The existing ContentEditor, safe rich-text contract/renderer, dirty-exit dialogs, optimistic versions, idempotent mutations, concise lower-right toasts and WAT timestamps are reused. Hero/profile draft/preview regressions remain covered.

Fields are page title, safe rich body (the existing 6,000-visible-character bound) and optional calendar effective date. Publication is immediate; the date labels the wording and does not schedule it. Draft saves, including unfinished bodies, never change the public snapshot. Canonical comparison normalizes plain/rich representations and object keys, and compares title/body/formatting/date; identical saves and reverts do not create false changes. A nonempty replacement requires an explicit “approved for publication” confirmation. The known Lorem ipsum body cannot be marked approved, including when wrapped in formatting. This attests the publisher's decision; the application does not certify legal compliance.

The initial published version remains **`development-placeholder-v1`**, with the exact original title/body and no invented date. No legal wording is supplied or approved by this task. Only synthetic isolated test wording is published during QA. There are **no Unpublish/Delete controls or endpoints**: the Join flow retains its last published policy while a draft is edited.

Every changed publication creates an immutable application-managed `privacy-<UUID>` snapshot containing title/body/date, actor and publication time. Identical republication retains its policy version/publication time. Old snapshots remain available to authenticated publishers through `?publishedVersion=…`; Super Admin application review links to the version recorded for that receipt. Unknown historical IDs return a truthful unavailable/404 result rather than invented text. Audits contain action/actor/time and version IDs, never the policy body, title, applicant answers or form token. Audit failure rolls back the working copy and snapshot together.

## Shared public policy and consent

`/privacy`, `/join` and `/api/privacy` use the same published-only reader and safe renderer. No draft, administrator identity or audit metadata enters public DTOs. `/privacy` has no removed return-to-membership button or visible development-placeholder callout. The existing Join consent help still identifies the placeholder until replacement wording is published. Noindex remains. Missing database configuration/schema or a read failure makes the policy unavailable and disables new submission; it never silently restores obsolete placeholder wording.

New two-hour HMAC form tokens bind the exact **policy and consent-wording versions presented**, using the existing `BETTER_AUTH_SECRET`. The consent statement/version stays `membership-review-v1`. Still-valid pre-A12 tokens map only to the original `development-placeholder-v1`/`membership-review-v1`. The existing signature namespace and receipt fingerprint remain available for these retries; token modifications are rejected.

Opening the native privacy panel checks the current publication without remounting form fields. Closing by button/backdrop/Escape restores focus and retains values and unchanged consent. When a new version is discovered, the panel shows it, the form token updates, consent is cleared and the applicant receives an explicit review/reconfirm message. A failed check is retryable and preserves entered values/consent; submission remains disabled until checking succeeds. The native dialog stays outside the fieldset, with keyboard containment and focus return; no new Radix/editor dependency enters Join.

A publication **while the panel/form is already open** does not replace wording mid-read. At submission, the server compares the signed presented version with the current published version under the shared application lock. A mismatch creates no application and returns the latest snapshot/token with values retained and consent cleared. The same protection applies when field validation fails before the transaction. The applicant must review and affirm again. Native no-JavaScript submission receives the same retained-value/reconsent response.

Privacy publication takes management lock `4631002` then application lock `4631003`, matching membership decisions. Submission holds `4631003`, so publication/receipt cannot race into unseen-wording attribution. A retry of an already successful receipt is checked before current-policy matching: it returns the original result, preserving its original consent even if the policy has since changed. Existing timestamps/wording versions are never rewritten. Pending expiry remains **720 elapsed UTC hours/30 days**, changes status and never deletes applications.

## Monitoring and navigation

Website now has Site content and **Monitoring dashboards** destinations in its established shell. `/admin/website/monitoring-dashboards` is a permission-guarded empty page with its heading only. No CRUD, metrics, integration controls, new service variables, public scientific-dashboard changes, Contact/Shared/About-body editor or scientific page builder is introduced.

## Migration and setup

Additive **`0015_privacy_policy.sql`** creates the singleton working/current-policy pointer and retained published-version table, and seeds only the exact existing placeholder/version. It does not update/delete membership rows or impose a new FK on unmapped historical consent versions. Existing migrations, runner and journal convention remain; A12 adds no build/start migration hook. Any deployment-side automation must be verified by its owner. Agent-run migration/rollback checks target only disposable loopback fixtures, never hosted databases.

Review backups and apply pending schema through the existing authorised operator/deployment process before hosted use. Rolling back application code does not authorise deleting policy history: receipts must retain a resolvable presented version. Restrict runtime writes to the intended services and retain versions/audits; no purge or retention/deletion policy is invented.

[Consolidated external-setup register](EXTERNAL-SETUP.md) distinguishes existing reported setup, missing configuration, unimplemented adapters and unverified live acceptance, with exact existing names and repeatable Preview/permanent organisation-owned steps. No new environment variable, dependency or external provisioning is needed for A12. Final wording/retention/legal approval remains a launch gate.

## Reproduction

Use [isolated fixture rules](architecture.md#local-integration-and-safe-review-fixtures): disposable `127.0.0.1:55433/nosee_admin01_test`, random credentials/auth/worker secrets in a private 0600 `/tmp/nosee-a12-private/test.env` under a 0700 directory and loopback `ADMIN_ORIGIN`. Include `CRON_SECRET` only to test the existing local expiry endpoint; keep Resend absent and membership email OFF. Apply migrations there, build with `npm run build -- --webpack` and start on the same local origin. Never run these destructive suites against Neon/hosted Preview/production.

Run the 24 selected units with `node --test --test-isolation=none tests/privacy-content.test.mjs tests/site-content.test.mjs tests/membership.test.mjs tests/admin-policy.test.mjs`; the four token cases with `node --conditions=react-server --test tests/privacy-tokens.mjs`; and, **sequentially**, `node --conditions=react-server --env-file=/tmp/nosee-a12-private/test.env tests/membership-integration.mjs` followed by `node --conditions=react-server --env-file=/tmp/nosee-a12-private/test.env tests/privacy-integration.mjs`. The A12 suite writes private random role fixtures to `/tmp/nosee-a12-private/privacy-fixtures.json`.

`tests/check-a12.cjs` takes loopback origin, that private fixture file, a temporary output directory and externally installed axe-core `axe.min.js`. Resolve Playwright/axe externally through `NODE_PATH`; do not add QA packages to production. Use system Chromium. Remove task processes/database/anonymous volume/generated credentials after review. Typecheck/lint/build and the [owner walkthroughs/current verification](reviews/12-privacy-monitoring.md) complete the handoff.
