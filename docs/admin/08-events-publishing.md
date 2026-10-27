# A08 — Events publishing and public integration

**27 October 2026.** Production candidate on `codex/a08-events`, from main `376622f` containing A07.2 PR #30 / `4ef0413`. The owner explicitly confirms A07.2 merged and owner-tested. Earlier A07.1/A06/A04/cross-role, provider and release checks retain their previous status. A08 is **in review, neither merged nor owner-accepted**.

## Implemented contract

Super Admin and Editor manage `/admin/publishing/events`, `/new` and `/[id]`: search, type/publication/timing filters, bounded pagination, draft or atomic direct publication, private saved/live previews, saved-revision badges, publish changes, unpublish/republish and exact `Delete {event title}` confirmation. Pages, APIs and transactions deny Research Group Leads and anonymous access. Working revisions do not affect public snapshots. Deleted records retain audits and permanently reserve their slug.

The editor uses existing Input/Button/Card/Dialog, safe Tiptap description/counting, dashboard toasts, MingCute/currentColor, icon-only row removal and the News navigation guards. Native form validity and server validation bound text, safe HTTP(S) links, repeatables, schedules, itinerary/deadlines and versions. Slugs are generated with collision suffixes, reserve every legacy slug plus `archive`/`new`, and remain stable after renaming. Creation, save, publication and deletion use retry keys; transaction authority is shared with News and serialized against administrator revocation. Audits record safe identifiers/actions/statuses, not full event bodies.

Fields include content, organiser/speakers, Featured, single-day/overnight or multi-day UTC instants plus supported IANA zone, optional timed itinerary/deadline, conditional physical/online/hybrid location, registration/meeting links and labelled resources. Hidden location/meeting values remain in the private working copy, but inapplicable fields are removed from published snapshots and canonical comparison. Publication requires a summary; regular details also require description/organiser. Meetings may omit those two fields because they redirect to their separate site. Physical/hybrid publication requires a venue; online/hybrid requires a platform.

Supported zones reuse the existing shared utilities: Africa/Lagos, UTC, Africa/Accra, Europe/London and America/New_York. WAT is the default. New-form times are captured once. Nonexistent local DST times fail; repeated autumn hours explicitly select the earlier occurrence, described beside the controls. Supported instants range from 1970 through 9998. End must follow start, multi-day must end on a later local date, and single-day can cross one midnight. Itinerary starts lie in `[start,end)` and optional ends are later and no later than event end. Deadline may equal end but cannot exceed it. Future event dates are valid; publication is immediate, with no scheduled-publication feature.

Public listing/archive/detail, metadata, redirects and homepage read only validated published snapshots. No fixture fallback exists, even for a deleted legacy URL or during failure. Existing layouts/URLs remain; search keeps trimmed repeated-scalar behavior and literal wildcard matching. Native type filters and 12-record pagination bound upcoming/ongoing/archive collections; directory pages hold 20 rows and send no bodies/snapshots in their DTO. Saved-revision comparison includes every public field and retained cover metadata, ignores bookkeeping and reuses A07.1/A07.2 canonical rich-document normalization.

Homepage selects at most three **upcoming** records: Featured first, nearest UTC start, then slug as a deterministic tie; fills from other upcoming records. Public routes remain dynamic and queries use the current database clock. A new external scheduler is unnecessary. Homepage database failure produces an empty event collection while preserving unrelated sections. Public clients have no admin/Tiptap chunks.

## Timing transition and legacy inventory

`src/lib/content/events.ts` at main `376622f` contains **nine inherited development fixtures**, including fictional organisers/speakers/venues and example.org URLs. They are not approved organisational facts. `legacyEventMapping()` preserves their original slug/content/media/destination and stores this provenance on every imported row. There are no valid pre-existing fixture images; retained supported local media on database records is preserved, with no upload/URL-picker mutation exposed.

| Reserved legacy slug | Existing meeting redirect | Mapping |
| --- | --- | --- |
| `atmospheric-measurement-seminar` | — | Original single-day start/end |
| `community-sky-observation-day` | — | Original single-day start/end |
| `earth-observation-data-workshop` | — | Multi-day date range; original itinerary |
| `environmental-data-training` | — | Multi-day date range; original itinerary |
| `icelli2026` | `https://icelli.nosee.org` | Multi-day date range; empty organiser/body retained |
| `ionospheric-methods-seminar` | — | Original start; missing end mapped to local 23:59:59 |
| `regional-space-weather-conference` | — | Multi-day date range; original itinerary |
| `satellite-climate-lecture` | — | Original single-day start/end |
| `small-grants-application-deadline` | — | Original single-day start/end |

Legacy meeting/multi-day timing used entire local calendar dates; regular single-day ends were inclusive and missing ends meant local end of day. Imported records have explicit UTC timestamps: missing range starts map to local **00:00:00**, missing range ends to **23:59:59** on the existing final date. These are migration defaults for review, not newly asserted schedule facts. New classification is consistently **Upcoming: now < start; Ongoing: start <= now < end; Past: now >= end**, including meetings/multi-day. Thus exact end now enters archive immediately, and every event time remains visible with a clear zone label. Details spanning a DST offset change show both offsets; itinerary ends on another date show that end date. The legacy pure helpers/oracle remain as import evidence; active public routes always pass database records.

Meeting GET/HEAD URLs, including trailing/encoded forms, return 302 to the published stored HTTP(S) destination. Query parameters cannot supply an override; credential-bearing URLs, unsafe schemes, whitespace and backslashes fail validation. No destination is fetched server-side. The proxy rewrites meeting requests to a read-only native redirect handler, which independently rechecks publication and preserves the exact stored Location header with an empty body. Direct calls to that handler also reject nonpublic/deleted records. Unknown/nonpublic/deleted public slugs use the existing complete global 404 rewrite. Database errors do not masquerade as deleted records.

## Setup register and hosted procedure

| Area | Status / owner action |
| --- | --- |
| Implemented code | Protected editor/services/API, public readers, homepage rule, importer, tests and review notes ready on this branch. No A08 merge or owner acceptance claimed. |
| Schema | Additive `drizzle/0011_events_publishing.sql`, journal entry; empty Event table and public-feed index. Existing automatic migration convention is unchanged. **Agent-run migration commands targeted only a disposable loopback database; hosted automatic-migration state remains unverified.** |
| Legacy import | Explicit, transactional, idempotent, preserving all nine URLs. Existing imported rows—including revised, unpublished or deleted rows—are retained unchanged. Conflicting nonlegacy ownership fails. **No hosted import was run by this task.** |
| Media | Valid retained local references/alt survive edits. Durable storage/upload/provider setup remains deferred. No repository-image selector, arbitrary image URL field or temporary media storage. |
| Other services | No ticketing/payment/attendee/calendar integration, provider configuration or email sending. Earlier mail/scheduler/privacy/release gates remain separate. |
| Hosted review | Owner provides isolated Preview database, exact origin/auth secrets and securely provisioned role access through existing procedures. Actual deployment build status/URL is recorded in the review notes when available; build success does not verify schema, import, accounts or interaction. |

For hosted rollout, review/backup the intended isolated database and permit the **existing automatic migration step** to apply 0011. Do not add seed/import work to automatic builds. Inventory with:

```sh
node --conditions=react-server --env-file=.env.local scripts/events-import.mjs
```

Review all nine records, their provenance, mapped times and external destinations before applying. By default the explicit apply imports **drafts**, preserving records without asserting factual approval or making development content live:

```sh
node --conditions=react-server --env-file=.env.local scripts/events-import.mjs --apply --actor=EXISTING_PUBLISHING_ADMIN_UUID
```

On a disposable review database only, or after the owner explicitly approves the listed development records for the intended nonlaunch host, add `--reviewed-published=slug-one,slug-two` to choose published imports. Unlisted records remain drafts. This option never republishes an existing imported record; review/publish such records through the editor. Never republish deleted/unpublished records by rerunning import. Resolve conflicting slug mappings manually before rollout; never delete or replace rows to force an import. The task ran import only against isolated fixtures. Before public launch, replace development content through normal editing/approval and complete the existing separate content/indexing/privacy/AT gates.

See [verification and six owner walkthroughs](reviews/08-events-publishing.md).
