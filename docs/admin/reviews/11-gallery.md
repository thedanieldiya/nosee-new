# A11 review — Gallery

**28 October 2026 · In review.** `codex/a11-gallery` starts from main `5db398a`, containing merged A10 PR #33. Core merged progress remains **10/13**; A10 owner walkthroughs are pending. [Implementation, storage contract and setup register](../11-gallery.md).

Gallery now supports standalone caption-required photos and albums, private metadata drafts/previews, validated contextual uploads, working/live snapshots, canonical revision badges, typed deletion and reference-safe retention. The existing `/multimedia` navigation now opens a restrained paginated public grid with album/photo details and a keyboard viewer. No legacy Gallery renderer existed; this new layout needs owner visual approval.

**Storage is deferred.** Production/Vercel fail closed with “Uploads are not configured.” Local previews do not become saved images. The explicit guarded filesystem adapter is used only in disposable loopback tests; no hosted upload acceptance is claimed.

## Verification

Local checks use synthetic images, random private fixture accounts and a disposable PostgreSQL database. Upload and browser suites mutate only guarded loopback test data and must run sequentially. Credentials, image objects, screenshots and logs stay outside Git. The schema is additive; no hosted migration, import, service configuration or destructive cleanup was run.

Local verification passed on 28 October:

- **68 focused Node cases:** 30 Gallery/image/render/schema and relevant A10/Events units, 23 PostgreSQL/API/upload/privacy cases and 15 existing Events integration regressions. Coverage includes actual JPEG/PNG/WebP/AVIF decoding, metadata stripping, size/dimension/type/body-timeout bounds, ownership/role revocation, missing/corrupt storage objects, idempotent finalization, partial failures/retries, atomic snapshots, canonical revert/bookkeeping behavior, Event eligibility, stale/concurrent/tombstone safety, safe audit rollback and additive migration preservation.
- **390px and 1440px authenticated browser workflows:** native picker and real File drag/drop, forced transient per-file failure/retry with successful-file preservation, caption/alt rules, stable IDs/keyboard reorder/currentColor, cover removal, private preview, draft/live isolation, revision badges, publication/unpublish, all three exit choices, exact typed deletion, production-mode unavailable uploads and Lead denial. **33 whole-page/dialog axe and overflow scans: zero violations/overflow; zero runtime errors.** Viewer arrows/Escape, initial focus and return to the opening thumbnail passed. A final thumbnail loading correction is also covered by the focused renderer tests.
- **Nine full unmasked public screenshot pairs** against the A10 build: homepage, About and `/privacy` at 390/768/1440px, with the same isolated data and zero changed pixels. New Gallery screenshots were visually reviewed separately; its layout still requires owner approval.
- **Typecheck, lint, production Webpack build and whitespace checks** passed. The local command is `npm run build -- --webpack`; Turbopack's worker is restricted locally. Sharp is pinned directly at the existing 0.35.5 version; no provider SDK/configuration was introduced.
- **15 public client manifests** contain no nonempty admin/Tiptap/upload-processing/Sharp entries. **91 changed-document local links** resolve. Full 404/noindex/canonical and bounded directory/album pagination checks passed; public DTOs contain no storage keys, uploader or admin data.

These upload results belong to the **isolated test adapter**, including a separate production-mode process that rejects it. Real provider/hosted upload acceptance, manual AT/device testing and owner approval remain unverified. No unrelated large suite was repeated. Actual pushed build/preview status follows in the publication note.

## Six current owner walkthroughs

Use secure existing isolated Preview accounts and synthetic metadata. Do not paste credentials into Git or review comments. Current hosted workflows intentionally stop short of image publication until a real adapter exists.

1. **Directory and metadata — Editor:** open Website → Site content → Gallery. Add an album name, description, calendar date, existing Event and display order; save a draft. Reopen it, inspect saved private preview, search/filter Photos/Albums/status and navigate pages when enough records exist. System timestamps show WAT; the album date stays the entered calendar date.
2. **Deferred upload honesty — Editor:** choose/drop a small raster image. See a clearly local preview, “Uploads are not configured” and disabled upload action. Save valid metadata without pretending the file was uploaded; publishing an empty album/photo is refused. Standalone photos require a caption and have no separate alt field.
3. **Exit choices — Editor:** change an album name/description and follow another admin link. Try Keep editing, Discard changes and Save as draft. Confirm the respective retained/discarded/saved values and keyboard focus. Local-only files trigger the same guard and are never described as persisted.
4. **Deletion and associations — Editor:** delete a synthetic metadata draft using exact `Delete {album name}`. Wrong text cannot submit; Escape/Cancel restores focus. Its Event remains intact, deleted Gallery IDs cannot reopen, and another album may retain that Event association. Unpublishing/deleting an Event must never delete its album.
5. **Role/public boundary — Super Admin, Editor, Lead, signed out:** Super Admin and Editor can manage Gallery; Lead pages/APIs/upload operations are denied and signed-out admin pages redirect. Open `/multimedia`: an empty collection has intentional copy, no draft metadata/media appears, direct missing/draft routes return full 404s and noindex remains. Review mobile/desktop spacing and the new public layout. Populated image/viewer flows below require the future provider.

6. **Local contract review only — Editor, isolated test adapter:** using the guarded disposable setup in the implementation notes, upload synthetic images, select/reorder/remove the cover and rename the album. Labels follow name/order while IDs remain stable. Compare caption-as-alt, descriptive alt and no-description fallback. Publish, save a revision and inspect the directory badge/live isolation; revert/save, republish and unpublish. These operations are implemented and locally verified now, but cannot be exercised on an unconfigured hosted provider. Never enable the filesystem adapter on Vercel/production.

## Later real-upload acceptance — separate, blocked until durable storage exists

After a separate approved provider implementation/configuration task, verify private origin ACLs, checksums, immutable objects, hosting limits and delivery revocation **before** calling uploads operational. As Editor/Super Admin, then perform this end-to-end flow on the isolated hosted Preview with approved synthetic media:

- Upload one captioned standalone photo, save/private-preview/publish it and verify the caption is exactly its public alt. Save an image replacement as draft: the old image stays live; republish switches it. Unpublish/delete revokes its old image route.
- Create an album; batch-upload several valid images plus an invalid or interrupted file. Confirm per-file progress/errors, successful-file preservation, individual retry and no duplicate attachment. Reject bad bytes, SVG, excessive bytes/dimensions and forged finalization. Reload after saving to confirm real durability.
- Select a cover, enter optional caption/alt or neither, reorder by keyboard and remove the cover. Confirm stable IDs, recalculated labels, the predictable replacement cover and independent viewer labels/fallback. Save a published revision: the directory shows Unpublished changes while the old album remains live. Revert/save clears the badge; publish changes replaces metadata/order/cover/captions atomically and clears it.
- Use `/multimedia` and album/photo details on mobile/desktop, search/filter/page a larger collection, and exercise viewer arrows/Escape/focus return. Event links appear only while that Event is currently published. Unpublish/delete the Event without losing the album. Delete the album with exact text: public eligibility ends while stored/history references remain protected. Run no cleanup as part of this walkthrough.

Earlier A07.1/A06/A04/A08/A09/A10 owner checks, live DOI/mail/scheduling, privacy/content/rights and broader public-launch/manual AT gates retain their previous states. No PR, merge, manual deployment, live migration or provider provisioning is authorized by this handoff.
