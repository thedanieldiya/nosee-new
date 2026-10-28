# A10 review — Hero and Leadership profiles

**28 October 2026 · In review.** `codex/a10-site-content` starts from main `2d22934` containing merged A09 PR #32. Core merged count stays **9/13**. A08/A09 owner walkthroughs/live DOI checks remain pending. [Implementation, transition decisions and setup register](../10-site-content.md).

Homepage hero now has ordered working/live snapshots, retained images, accessible reorder/removal, drafts, private preview and atomic publication. Leadership profiles have direct publishing/revisions/preview/unpublish/typed deletion, safe biography/portrait/order rendering and explicit About cutover. A04's existing identity IDs and confirmed one-to-one member-link services are reused; only Super Admins receive member associations or private search results.

## Verification

Final local checks passed on 28 October:

- **89 focused Node cases:** 54 input/render/carousel/permission/homepage/About units, 19 A10 PostgreSQL/API cases and 16 existing A04 member cases. Coverage includes atomic hero publication, draft isolation, initialization/backfill/tombstones, canonical revisions, role/version/idempotency/concurrency, safe audits, one-to-one association, deletion/member retention and cache-refresh failure reporting.
- Both **390px and 1440px browser walkthroughs** passed the real authenticated hero/profile forms, keyboard reorder/currentColor/target checks, all dirty-exit actions, private previews, draft/direct publication, revision/revert/unpublish/delete, namesake suggestions, Super Admin link/unlink/Member picker and Editor/Lead restrictions. **32 scoped axe scans had zero violations**, runtime errors or document overflow. An additional **15-profile collection at 320px** passed alignment, wrapping, 24px targets, overflow and scoped axe, for **33 scans total**.
- **Six homepage/About screenshot pairs** at 390/768/1440px against the A09 build had zero changed pixels **outside the affected carousel areas**, hidden for comparison. Unmasked intended hero/profile states were visually reviewed separately. Explicit accessibility/compatibility differences: invisible 24px hit areas around the unchanged 12px/8px dots, small horizontal dot-spacing changes and corrected first-card container-offset clipping. Large profile groups wrap controls. Other homepage/About copy and layout remain unchanged.
- **Typecheck, lint, production Webpack build and whitespace checks** passed. The local command is `npm run build -- --webpack`; deployment settings/dependencies/lockfile are unchanged.
- **Twelve public client manifests** have no nonempty admin/Tiptap chunk entries. With an unavailable database, homepage/About return 200, retain unrelated sections and never restore hero/profile fixtures. The initialization CLI's read-only inventory and isolated repeatable initialization/draft-import paths were checked.

Automated checks do not establish full accessibility conformance, manual AT/device review, hosted interaction or owner approval. No unrelated large test suites were repeated.

All agent-run migrations/initialization/imports and mutations use synthetic fixtures in disposable loopback `nosee_admin01_test`. No live migration/import, service setup, email, manual deployment, PR or merge. Existing automatic migration behavior is unchanged.

## Six owner walkthroughs

Use secure existing isolated Preview accounts and synthetic records at mobile and desktop widths. Keep credentials out of Git/review comments.

1. **Hero editing/order — Editor:** open Website → Homepage. Edit existing copy/alt/credit/CTA, add an image-free slide and move it up/down with keyboard controls. Confirm removal affects the draft only. Publish changes; the whole order changes together. One slide has no indicators; several slides preserve navigation and reduced-motion behavior.
2. **Hero draft isolation — Editor:** save a changed title/order/removal as draft. Inspect saved preview and the unpublished-changes status, then open the public homepage: its previous hero stays live. Exercise Keep editing, Discard and Save as draft when leaving dirty content. Publish to replace the snapshot.
3. **Profile publishing — Editor:** add a named profile with role, optional affiliation/interests and formatted biography. Save draft/private preview, then publish directly. First publication intentionally replaces About's development placeholders. Save a revision, see the directory badge while About stays unchanged, revert/save to clear it, then publish a correction. Check order and neutral portrait rendering.
4. **Identity association — Super Admin:** search/select a profile in Member details, review name/role/affiliation/ID and explicitly link it. On the profile screen, review/unlink/relink an existing member with confirmation. No content is copied/published or account created; another member cannot claim an assigned profile. Stale versions require refresh/review.
5. **Editor privacy — Editor/Lead:** Editor manages public fields but sees no member association/search/count or private answers/notes. Attempt deletion of a linked profile: only a generic instruction to contact a Super Admin appears. Lead pages/APIs are denied; signed-out pages redirect and APIs deny access.
6. **Removal/member safety — Editor/Super Admin:** unpublish and republish a profile. Delete an unlinked profile with exact `Delete {display name}`; Super Admin can also delete a linked profile. About loses eligibility without restoring placeholders. The member remains intact with only the association detached. Separately deleting a member retains its independent public profile. Verify empty, single and several-profile carousel states.

## Remaining owner actions

Verify migration 0013 via the existing automatic convention on the intended isolated Preview DB, secure origin/auth/role access and the hero initialization/profile cutover decisions. Approve real profile facts/portraits and existing hero destinations, complete the six flows and manual assistive-technology/device review. Durable uploads and earlier A08/A09/provider/mail/privacy/release gates remain separate.

**Pushed implementation:** [`2949137`](https://github.com/thedanieldiya/nosee-new/commit/29491378b642a18b690dec054f16ada748a27ab4), verified against the remote branch. Vercel reports a [successful implementation build](https://vercel.com/thedanieldiyas-projects/nosee-new/ZrEaLZybM3KfXoFffVwa3pnXF8P9). Its check-run output supplies the actual [Homepage editor preview](https://nosee-new-git-codex-a10-site-content-thedanieldiyas-projects.vercel.app/admin/website/site-content/homepage), [Leadership directory preview](https://nosee-new-git-codex-a10-site-content-thedanieldiyas-projects.vercel.app/admin/website/site-content/leadership-profiles) and [public About preview](https://nosee-new-git-codex-a10-site-content-thedanieldiyas-projects.vercel.app/about).

**Hosted interaction unverified / Preview blocked:** the available page-read tool cannot access the preview. Verify automatic migration 0013 on the intended isolated Preview database, origin/auth configuration and secure existing Super Admin/Editor/Lead access before the six walkthroughs. Review initialization/import and first-publication/cutover decisions independently of build success. No hosted migration/import/account/configuration command was run. Local task servers/database/generated credentials were removed; the checkout is clean. A documentation-only follow-up records this handoff. No PR or merge was created.
