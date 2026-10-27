# A07.2 — Password visibility and News revision indicators

**27 October 2026 · Code ready for owner review.** Branch `codex/a07-2-password-news-revisions` starts at main `c32939d`, containing [A07.1 completion PR #29](https://github.com/thedanieldiya/nosee-new/pull/29). This is a correction within A07; progress remains **7/13 core milestones merged**. A07.1 owner/hosted interaction checks remain unverified, as recorded in its [handoff](../07-1-news-workflow-public-wat-toasts.md).

## Changes

One shared `PasswordInput` wraps the existing Input/Button components. All seven browser password-style fields use it: sign-in, current/new/confirm password, and invitation code/new/confirm password. Values start hidden; MingCute eye/closed-eye controls have Show password/Hide password action labels, `type="button"`, matching `aria-controls`, 44px targets and input padding. Pointer use preserves field focus/selection where supported; keyboard use keeps focus on the button. Native names, autocomplete, validation and disabled states remain. Visibility is local component state, with no persistence or logging.

News directory rows now show **Published · Unpublished changes** when their saved working content differs from the live snapshot. Editor and directory share the A07.1 canonical fingerprint, with an explicit projection of publication fields: title, category, excerpt, normalized rich body, UTC instant/editorial timezone, Featured, stable slug and supported cover metadata. Missing historical zones fall back to Lagos. IDs, versions, timestamps, actors and mutation bookkeeping are ignored. Draft/Unpublished rows have no extra badge.

The server reads only the existing bounded page of up to 20 records, compares locally and returns the previous compact directory fields plus one boolean. Bodies, excerpts and snapshots are excluded from that DTO; there are no per-row database queries. Saving a revision does not replace the live snapshot. No migration, dependency, external service or public-page change is introduced.

## Verification

- **42 focused Node cases passed, no failures/skips:** 17 unit/render cases and 25 isolated PostgreSQL News integration cases. These cover canonical formatting/date/default equivalence, every publication field, bookkeeping-only changes, save/revert/publish/unpublish, compact DTOs, pagination/filters, authorization and snapshot isolation.
- Production-browser workflows at **390px and 1440px** exercise all seven controls independently with pointer, Enter and Space; retained values/selection/focus; zero toggle submissions; 44px touch areas, padding and currentColor; hidden state after revisiting; actual sign-in, password-change, invitation activation and subsequent sign-in; and directory badge transitions/live content isolation.
- **Eight scoped axe scans passed**, with no runtime errors or horizontal overflow, covering sign-in, password change, activation and the News directory at both widths. Manual screen-reader/device acceptance remains open.
- Typecheck, lint and **Webpack production build** passed. Webpack is used because this workspace restricts the default Turbopack CSS worker's port binding, as documented for A07.1. No build/deployment setting was changed. Unrelated large suites were not repeated.

All database/browser tests used synthetic records in disposable loopback `nosee_admin01_test`. The invitation transport was mocked; no email was sent. Credentials and reports stayed outside Git. Relevant commands: `node --test --test-isolation=none tests/news.test.mjs tests/news-revision.test.mjs tests/password-input.test.mjs`, the guarded `tests/news-integration.mjs` and `tests/check-a07-2.cjs`, `npm run typecheck`, `npm run lint`, and `npm run build -- --webpack`.

## Two owner walkthroughs

1. **Passwords:** on sign-in, account Password settings and invitation setup, enter test values and use each eye button by pointer and keyboard. Only its field should change visibility, its label should switch Show/Hide, and its value/selection should remain. Confirm toggles never submit; submit the normal forms separately. Revisit a page and confirm values are hidden. Use securely provisioned preview accounts and an approved invitation; never share passwords/codes in review comments.
2. **News revisions:** as Editor, publish an article, save a changed working body, then return to News. It should read Published with an Unpublished changes badge while the public article stays unchanged. Revert and save to clear the badge, then make another revision, save and republish; the badge disappears and the public snapshot updates. Draft and Unpublished retain their ordinary labels.

Hosted preview and owner acceptance are independent of code checks. The actual branch deployment URL/status will be recorded when available; secure isolated Preview schema/origin/auth/role setup remains necessary. No PR, merge, manual deployment, live migration or external configuration was performed.
