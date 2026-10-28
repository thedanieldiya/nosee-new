# A11 — Gallery, standalone photos and albums

**28 October 2026 · Merged in [PR #34](https://github.com/thedanieldiya/nosee-new/pull/34); owner walkthroughs, layout approval and hosted storage acceptance pending.** Branch `codex/a11-gallery` starts from main `5db398a`, containing merged [A10 PR #33](https://github.com/thedanieldiya/nosee-new/pull/33). Core progress is **11/13 merged** after A11 (main `9ae00c6`). A10 owner walkthroughs remain pending. A12 is separate review work; durable hosted uploads are **not operational**.

## Authoring and publication

Website → Site content → Gallery is `/admin/website/site-content/gallery`. The combined, paginated directory searches captions/album names and filters photo/album and publication status. Super Admin and Editor can manage records, private previews and every upload stage. Leads and anonymous callers are denied by page/API guards and current-authority database checks. There is no global Media Library or unrelated editor rewrite.

A standalone photo has one image, required caption (also the public alt), display order and status. Save its caption as a metadata draft to establish the upload context, then attach a finalized image and save or publish. There is no competing alt input. Replacement in the working copy leaves the old public image live until publication.

An album has a required name, optional description, existing nondeleted Event, calendar date, cover selected from its own photos, display order and up to 100 photos. Each attachment has a stable UUID independent of its generated `[Album name] - N` label. Renaming regenerates every label; moving/removing a photo renumbers the current order without changing remaining IDs. The first attached photo becomes the default cover; removing the selected cover chooses the first remaining photo, or clears it when empty. Both operations affect only the working copy.

Album captions are optional. A caption wins over optional descriptive alt. With neither, the image has empty alt and a separately labelled viewer announces “No description was provided for this photograph.” Labels identify positions; they do not describe image contents. No descriptions are invented.

Metadata, attachment IDs/order, cover, captions and alt publish in one transaction. Only finalized context-owned images are eligible. Canonical content comparison, independent of timestamps/upload bookkeeping, controls Unpublished changes. Reverting and saving clears the indicator. Optimistic versions, idempotent mutations, dirty-exit choices, WAT system timestamps, concise shared toasts and safe ID/action/status audit entries reuse existing publishing patterns. Calendar dates do not shift with timezone.

Typed `Delete {current caption or album name}` tombstones the record and removes public eligibility; stale requests cannot restore it. Slugs are automatic, hidden, stable after rename, collision-suffixed and reserved after deletion. Deletion never deletes the linked Event. Event unpublish/delete suppresses its public link without deleting the album. Clear a deleted association before the next save.

## Upload contract and bounds

`src/lib/media/storage.ts` defines server-only immutable private writes, verified stats and bounded reads. It is suitable for later contextual adapters in Hero, Leadership, Research, News and Events; A11 integrates Gallery only. No provider, SDK, credentials or provider environment-variable names have been invented.

The picker and drop target show clearly local previews. Batches contain at most 10 files, with two workers and a shared database limit of two active processing leases. Each file shows upload progress, processing/finalization status and individual retry. Successful files remain attached when another fails. Request identity and finalization retries do not duplicate assets/attachments. Five failed processing attempts require selecting the file again. Leaving aborts browser work and releases local object URLs; immutable attempted keys remain recorded for later reconciliation.

Each raw request is limited to **4 MiB (4,194,304 bytes)**, below [Vercel's documented 4.5 MB function payload limit](https://vercel.com/docs/functions/limitations). The relay uses a raw body, not multipart/base64. A future larger/direct-upload flow needs a separately reviewed adapter/hosting design. Browser MIME and extension do not establish validity: magic bytes and actual Sharp decoding must agree. Allow static JPEG, PNG, WebP and AVIF only; reject SVG/HTML/executables, corrupt, animated, mismatched, over-12,000px-side or over-40-megapixel images. Decode/re-encode applies orientation and drops source EXIF/GPS/IPTC/XMP; source files and filenames are not stored. Pin the already-used Sharp version directly.

Create 640px thumbnail and 1600px large WebP variants without enlargement. Generated immutable keys contain context/asset/attempt UUIDs only. Current role, record, uploader, declaration, lease and adapter are checked before accepting bytes and again after storage work. Finalization requires both actual private objects with matching size, SHA-256 and type; browser-supplied keys/variant metadata are rejected. No arbitrary URLs are fetched.

The body reader is byte/time bounded (60 seconds); each Sharp transform has a 10-second timeout, each provider operation 15 seconds and browser binary upload 120 seconds. These are application bounds, **not verified hosted execution/memory guarantees**. Provider implementation and hosting acceptance must confirm that the selected function runtime covers the full sequence and that immutable late writes remain reconcilable.

## Media privacy and references

Draft delivery requires current publishing permission. Public delivery uses opaque same-origin routes and checks the record's **current published snapshot references** before and after reading bytes. No permanent public object URL, storage key, checksum, uploader or administrator data enters public DTOs. Responses are no-store, nosniff and noindex; unpublish/delete/republish revokes old live eligibility without waiting for a public object/CDN TTL. A future provider must keep its origin private and preserve this delivery boundary.

Working, published and retained-history references are tracked separately. Removing a working photo retains both the object and any live reference. Superseded/deleted references move to history; they remain protected until an owner-approved retention policy exists. Read-only Super Admin cleanup eligibility is limited to at most 100 unreferenced pending/failed/ready assets with **seven days of creation and update inactivity**, no active lease and no reference in any context. Staged/in-progress uploads are excluded. Eligibility is a review aid, not authorization to delete. Attempt keys are retained for orphan reconciliation. There is no delete-object method, cleanup command, schedule or destructive storage run.

## Public presentation

The existing navigation/footer Gallery URL is **`/multimedia`**. No usable legacy Gallery renderer/collection was present, so A11 implements the owner's permitted restrained NOSEE grid, album details and standalone photo detail at `/multimedia/photos/{id}`. This **new layout requires owner visual review**; arbitrary repository photographs are not published or imported.

Published snapshots alone feed the directory and direct routes. Albums use stable `/multimedia/{slug}` URLs; absent/draft/unpublished/deleted records produce complete 404s. Empty collections have an intentional message. Lists and albums show 12 items/photos per page with native search/filter/page links; responsive bounded images lazy-load below initial content. The viewer loads the larger variant on opening, labels controls independently, supports arrows/Escape and restores focus. Noindex and public-launch restrictions remain. Other public pages retain their A10 design.

## Setup register — deferred external work

| Area | Current state and exact remaining work |
| --- | --- |
| Schema | Additive `0014_gallery_media.sql`, journal entry and typed tables. Applied/tested only on disposable loopback PostgreSQL. Existing automatic migration convention is unchanged; verify it on the intended isolated hosted Preview DB. No agent-run live migration/import. |
| Durable storage | **None selected/configured.** Production and Vercel return “Uploads are not configured”; metadata drafts work, local previews remain local and missing-image publication is refused. Select an approved provider later; implement its actual SDK adapter/credential configuration in `mediaStorage()`, private origin access, immutable write/checksum/stat/read guarantees, bounded calls and provider error handling. Document actual configuration names only then. No purchase/provisioning here. |
| Delivery/hosting | Validate private ACLs and deny direct public origin access; verify no-store publication-gated routes, function body/response, duration/memory, image processing/native Sharp support and late-write reconciliation with the real provider. Preserve variant bounds. Do not replace this boundary with permanent public URLs. |
| Lifecycle | Owner must define retention/history and orphan policy before any cleanup implementation. Audit references across every future context, failed attempts and provider objects; require a separate reviewed cleanup task. No cleanup or scheduler configured. |
| Isolated test adapter | `tests/helpers/gallery-test-runtime.mjs` explicitly injects an immutable filesystem adapter. It requires NODE_ENV=test, no VERCEL, exact loopback `127.0.0.1:55433/nosee_admin01_test`, loopback ADMIN_ORIGIN and private `/tmp/nosee-a11-private/` storage. Application code never imports it; env settings alone cannot install it. Never enable it on Vercel or production. Test results do not certify hosted uploads. |
| Owner access/content | Confirm protected actual branch URL, migrated isolated Preview DB, exact ADMIN_ORIGIN and secure existing role accounts. Approve the new Gallery layout, genuine content/media rights, manual AT/device behavior and later real-provider flow separately. A10 and earlier unverified checks remain open. |

## Reproducing local checks

Follow [the isolated database/account rules](architecture.md#local-integration-and-safe-review-fixtures), using only disposable `127.0.0.1:55433/nosee_admin01_test`, private 0700 `/tmp/nosee-a11-private` and a 0600 environment file with random test credentials/auth secret, loopback ADMIN_ORIGIN and NODE_ENV=test. Apply migrations only to that disposable database. Never point these suites at a hosted database. No provider environment variables are needed. Run mutations sequentially.

Run the 30 selected units with `node --test --test-isolation=none tests/gallery.test.mjs tests/media-images.test.mjs tests/site-content.test.mjs tests/events-authoring.test.mjs`, plus typecheck/lint and `npm run build -- --webpack` (the local Turbopack worker is restricted). Start the built local test process with `node --env-file=/tmp/nosee-a11-private/test.env --import ./tests/helpers/gallery-test-runtime.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 4321`. Start a second built process on 4322 with the same isolated DB/auth configuration, ADMIN_ORIGIN=http://127.0.0.1:4322, NODE_ENV=production and **no preload** to check fail-closed behavior.

Then run `node --conditions=react-server --env-file=/tmp/nosee-a11-private/test.env --import ./tests/helpers/gallery-test-runtime.mjs tests/gallery-integration.mjs`. It writes random fixture accounts to a private `/tmp/nosee-a11-private/fixtures.json`, never to Git/logs. The browser harness accepts loopback origin, that fixture path, temporary output directory and an externally installed axe-core script: `node --env-file=/tmp/nosee-a11-private/test.env tests/check-a11.cjs http://127.0.0.1:4321 /tmp/nosee-a11-private/fixtures.json /tmp/nosee-a11-browser /path/to/axe.min.js`. Resolve Playwright/axe externally through NODE_PATH, use system Chromium and keep QA dependencies out of production packages. For optional interactive local review, use the generated fixture accounts only through a secure local channel. Destroy the task processes/database/anonymous volume/private files after review.

[Verification and owner walkthroughs](reviews/11-gallery.md).
