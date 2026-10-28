# A09 review — DOI-first Publications

**28 October 2026 · In review.** Branch `codex/a09-publications`, from main `abe9457` containing A08 PR #31. A08 is merged with owner walkthroughs pending; core merged progress remains **8/13** while A09 is reviewed. [Implementation, provider/date/identity decisions, import and setup register](../09-publications.md).

Publications now have DOI-first editable metadata, manual entry, author order/organisational names, partial dates, real optional research associations, draft/direct publication, private previews, saved-revision badges, unpublish/republish and exact typed deletion. Public listing/detail pages and latest-three homepage output selection read only published snapshots. Shared News/Events authority, retry/version/exit/toast/UI patterns are reused; no new dependency or external account/provider setup.

## Verification

Final local checks passed on 28 October:

- **80 focused Node cases:** 23 DOI/provider/date/render/homepage unit cases, 17 Publications PostgreSQL/API integration cases, 25 existing News cases and 15 existing Events cases. Provider responses are mocked; API/service tests use real synthetic sessions and the isolated database.
- **Both 390px and 1440px browser walkthroughs**, including real authenticated cached lookup, debounce without blur, repeat/review/edit/stale-result protection, unavailable-group clearing, manual recovery, all exit actions, publication/revision/revert/unpublish/delete and Lead denial. **24 scoped axe scans**, zero reported violations, runtime errors or horizontal overflow. New author controls passed keyboard, 44px target and computed currentColor checks.
- **27 existing HTTP route checks**, plus complete nonpublic Publication 404 checks in integration. Four About/Privacy screenshot pairs against the A08 production build had **zero changed pixels**. Publication editor/list/detail screenshots were visually reviewed; the new academic design and homepage destinations are intentional changes.
- **Typecheck, lint, production Webpack build and whitespace checks.** The default local Turbopack attempt hit the workspace's CSS-worker port-binding restriction; the successful production command was `npm run build -- --webpack`, without changing project deployment settings.
- Twelve public client manifests contain no nonempty admin/Tiptap/provider-transport chunk entries. The unavailable-database homepage returns 200, retains unrelated sections and never restores publication fixtures.

Automated checks do not establish owner acceptance, full accessibility conformance or live provider availability. No unrelated large test suites were repeated.

Live API smoke was attempted separately using known public Crossref/DataCite DOIs. Both runtime requests returned proxy **CONNECT 403**. Provider tests use mocked responses; no live lookup success is claimed. Public endpoints require no credentials or paid plan. Normal manual saving/publication remains available during lookup failure or limits.

All mutations, migrations and imports used synthetic data in disposable loopback `nosee_admin01_test`. Credentials/screenshots/logs stay outside Git. No live migration/import command, external configuration, email, manual deploy, PR or merge. Existing automatic migration conventions remain; hosted schema state must be verified independently.

## Six owner walkthroughs

Use secure existing Preview accounts and synthetic records, at mobile and desktop widths. Never place passwords or private account details in review comments.

1. **DOI autofill/edit — Editor:** Add publication, paste a known DOI or doi.org URL, blur and watch loading/outcome. Supplied title/authors/type/date/source/reference should fill an untouched citation. Edit a field, repeat lookup and review/apply or keep current fields explicitly. Type during a delayed lookup and change DOI; corrections and stale-response protection should hold.
2. **Manual/recovery — Editor:** choose Enter manually, leave DOI absent and enter title, year/month/full date plus author or source. Publish without lookup. Try an unknown DOI or a temporary provider failure, use Retry, then continue manually; saving must remain available. Organisational authors need no invented name splits, and author order is retained.
3. **Draft/direct publish/revisions — Editor:** save a draft and open private preview; its public path stays 404. Publish directly from current fields. Save a changed working abstract or citation; directory shows Unpublished changes while the public page stays unchanged. Revert/save to clear it, then change and Publish changes to replace the snapshot.
4. **Public/homepage — Editor:** inspect `/publications`, search/type/area/page controls and a detail page's authors/date/source/DOI/reference/research labels. Year-only dates stay year-only. Publish more than three works with mixed partial dates; homepage shows at most the latest three by the documented sort rule, with working detail links and no Featured picker.
5. **Duplicates/deletion — Editor/Super Admin:** enter the same DOI with different case or resolver URL on another record. Expect an existing-record link and no duplicate/merge. Delete using exact `Delete {title}`; Cancel/Escape/backdrop and pending state should be safe. The public URL and homepage eligibility disappear; the slug and historical DOI remain reserved, and a stale editor cannot republish it.
6. **Roles/unpublish — Super Admin/Editor/Lead:** both publishing roles can list/edit/lookup/preview/publish. Unpublish removes public eligibility, then republish restores the latest saved snapshot. Lead pages and APIs—including lookup/group selection—deny access; anonymous pages redirect to sign-in and APIs deny access. Earlier A08/other owner checks remain separate.

## Remaining owner actions

Verify migration 0012 under the existing automatic convention on the intended isolated Preview DB, secure origin/auth/role access, provider runtime egress/live autofill and the reviewed draft import decision. Complete the six flows and manual assistive-technology/device review. Approve real citation/content/group facts before public launch; uploads and unrelated earlier setup/owner gates remain open.

**Hosted preview:** branch push and actual deployment status/URL pending; no hosted interaction is verified.
