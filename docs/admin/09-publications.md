# A09 — DOI-first Publications

**28 October 2026 · Production candidate, in review.** Branch `codex/a09-publications` starts from main `abe9457`, containing A08 PR #31. **A08 is merged, with owner walkthroughs pending; core merged progress is 8/13.** A09 has not merged or passed owner acceptance. Earlier A07.1/A06/A04/cross-role/provider/release gates retain their previous status.

## Code and editorial contract

Super Admin and Editor manage `/admin/publishing/publications`, `/new`, `/[id]`, private previews, lookup and group selection. Research Group Leads and anonymous callers are denied on pages/APIs and current-authority service transactions. Search, type/area/status filters and bounded 20-row pagination return a compact directory projection with a canonical saved-revision boolean, without abstracts, snapshots or lookup payloads.

The editor uses existing branded Input/Button/Card/Dialog, MingCute/currentColor, keyboard group autocomplete, repeatable author removal, News/Events save/exit/version/retry patterns and dashboard toasts. Draft and atomic direct publication use current fields; saved revisions retain the public snapshot. Publish changes replaces it atomically; Unpublish removes public eligibility; exact `Delete {publication title}` plus current version/confirmation soft-deletes it while retaining audits and its slug. No periodic autosave. System dates display in WAT; bibliographic dates remain calendar metadata.

DOI is the first field. Bare identifiers and standard http(s) doi.org/dx.doi.org URLs normalize to lower-case DOI identifiers; resolver URL credentials, query/fragment overrides, malformed encodings, whitespace and arbitrary hosts are rejected. Suffix punctuation is preserved rather than guessed away. Publication fields remain editable: title (400 characters), up to 200 ordered full/organisational author names (240 each), type, partial date, source (400), safe HTTP(S) reference (2048), optional editor-entered plain-text abstract/summary (6000), existing five research-interest choices and optional real non-deleted group. No Featured field or homepage picker.

To publish, require title, at least a bibliographic year, and either an author or source/issuing organisation. Source and authors are each optional when the other supplies attribution; DOI, abstract, reference and group/areas are optional. `Other` is the neutral manual type default. Future bibliographic dates are valid and publish immediately, without scheduled-publication semantics. Provider failure never becomes a save/publish requirement.

Only supplied lookup fields are proposed; missing/unsupported fields remain untouched. A pristine empty citation can auto-fill. Populated citations or edits made during lookup receive an explicit Review metadata / Apply metadata / Keep current fields step. Repeated/cached lookup does not silently replace corrections. Changing DOI aborts or ignores stale responses; manual entry can cancel lookup. Lookup provenance stores only canonical DOI, provider and retrieval instant, and is excluded from the public projection and revision comparison.

Research-group search exposes only a bounded ID/name catalog to publishing roles. Draft/deleted/private group bodies, memberships, leads and administrative fields are not returned. Publication association requires a real non-deleted group at save/publish. The public snapshot includes a group name/slug only from an already published group snapshot; a draft group can remain associated privately. Public group labels are captured at publication time, not pulled from a changing private group record. Deleting a publication never deletes groups, members or external source content.

## DOI provider and safeguards

Current official documentation consulted on 27 October 2026: [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), [current Swagger reference](https://api.crossref.org/), [Crossref endpoint/efficiency guidance](https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/), and [DataCite singleton retrieval](https://support.datacite.org/docs/api-get-doi). The older GitHub Crossref README explicitly marks itself deprecated; it is not the current documentation authority.

The server requests only `https://api.crossref.org/works/{encoded-doi}` and, after Crossref 404, `https://api.datacite.org/dois/{encoded-doi}`. These public endpoints require **no account, paid plan or secret**. There is no arbitrary URL fetching, provider-supplied next URL, full-text retrieval or automatic abstract import. Fetch uses manual redirects, identified User-Agent, JSON/content/schema checks, DOI identity matching, a 256 KiB declared/streamed size limit and a three-second per-provider timeout. Redirects, malformed/oversized data and network failure produce a manual-entry outcome. Provider 429 stops further calls and honours bounded Retry-After (5–300 seconds).

A shared PostgreSQL cache stores only minimal normalized citation/provenance results: success 24h, no-match 10m, failure 30s and rate-limit results for Retry-After. A ten-second claim lease deduplicates concurrent same-DOI work across instances; a token prevents late writes replacing a new lease. Lookup authorization/duplicate checks occur before cache access and again after network work; network I/O is outside the authority lock. Uncached attempts are limited to 10 per actor/minute and 60 globally/minute; generic publishing HTTP/body controls remain. Expired cache rows are cleaned in bounded batches. A bounded per-editor cache and 400ms debounce avoid redundant requests. Retry does not bypass provider/cache limits. Manual publication is independent of these lookup budgets.

Live smoke attempts against known public Crossref DOI `10.1038/nphys1170` and DataCite DOI `10.14454/qdd3-ps68` were blocked by the workspace's HTTPS proxy: **CONNECT 403**. Official documentation was readable through the connected web tool; that does not verify runtime API lookup. Mocked checks passed separately. Hosted runtime egress and actual autofill remain owner checks; no network policy/provider account was configured.

## Identity, dates and public pages

`publication.doi` has database-backed normalized uniqueness. `publication_doi` permanently reserves every DOI used by a record, including former live/working DOI values and tombstones. This prevents a DOI correction saved as a draft from releasing the still-live DOI to another record. Duplicate/conflicting requests return an authorized existing-record link; deleted-record reservations return a truthful conflict without a broken edit link. No automatic merge, similar-title merge or resurrection. Correcting DOI preserves the record's identity/history; releasing a mistaken historical reservation would require a separately reviewed administrative repair, not automatic reassignment. Slugs are hidden, title-derived, collision-suffixed, stable after rename and reserved after deletion, including all legacy slugs.

Dates accept real `YYYY`, `YYYY-MM` or `YYYY-MM-DD` values from years 1000–9999. The stored/displayed value retains its precision. Sorting uses numeric `YYYYMMDD`, with unknown month/day represented by **zero only in the sort key**. Thus `2026-05-09` sorts ahead of `2026-05`, then `2026`, while a later year always sorts ahead of an earlier year. Ties use slug ascending with C collation. No January 1 or fake day appears in display, metadata or stored calendar values. Year-only public dates use plain text; month/full dates use valid HTML time values.

The approved academic `/publications` listing and `/publications/[slug]` detail pages use the NOSEE shell, typography, green tokens and restrained spacing. They provide native search/type/area filters, 12-record pagination, ordered authors, precision-safe dates, type/source, safe DOI/reference links, optional editor-supplied abstract and published research labels. “View publication” identifies external access without PDF/open-access claims. Canonicals reuse the existing configured-origin helper; prelaunch noindex remains. Draft/unpublished/deleted details use the complete global 404 path; database failures do not restore fixtures.

Homepage Research Outputs retains its card/layout design but receives **up to three latest published snapshots**, independent of Featured. Card titles and the desktop action now link to actual internal details; View publication replaces the legacy Read Here DOI action. No other homepage section is redesigned. Public payloads explicitly omit group IDs, lookup provenance, actor/version/internal fields and private group/member data. Admin/provider/Tiptap dependencies do not enter public client chunks. Empty/database-unavailable publication collections do not break unrelated sections.

## Legacy transition and setup register

All ten `src/lib/content/publications.ts` records at main `abe9457` are explicitly inherited **development fixtures**, with fictional authors/sources and unverified `10.5555/nosee.dev…` DOIs. None is treated as approved organisational content or queried to manufacture provenance. `legacyPublicationMapping()` preserves their slugs, ordered authors, date precision, source, DOI and mapped existing interest area. The old Featured flag is intentionally dropped. Runtime reads never fall back to fixtures.

Reserved slugs: `equatorial-plasma-bubble-detection`, `geospatial-data-cube-for-coastal-change`, `harmattan-particulate-transport`, `hybrid-renewable-grid-planning`, `low-latitude-geomagnetic-storm-responses`, `open-workflows-for-earth-observation`, `regional-heatwave-indicators`, `satellite-soil-moisture-drought-signals`, `solar-resource-variability-west-africa`, `urban-aerosol-optical-depth-patterns`. The old URLs were external DOI links; the new internal paths preserve these established content slugs without rewriting external sources.

| Area | Implemented / remaining action |
| --- | --- |
| Code | Protected Publications workflow, bounded DOI lookup/review/cache, public pages and homepage feed implemented on the review branch. No A09 merge/owner acceptance claimed. |
| Migration | Additive `0012_publications.sql` and journal: publications, permanent DOI reservations and minimal lookup cache/feed index. Existing automatic migration convention is unchanged; agent-run commands target only the disposable loopback DB. Hosted automatic-migration state remains unverified. |
| Import | Explicit repeatable mapping; default imports drafts, never automatically publishes development facts. Existing imported edited/unpublished/deleted rows remain unchanged; conflicting DOI/slug ownership fails transactionally. No live import command was run. |
| DOI provider | Crossref first, DataCite after no-match; public endpoints, no credentials/account/paid service. Runtime HTTPS access to both hosts is required; workspace live smoke blocked as documented. |
| Deferred | Durable storage/uploads, PDFs, reference-manager integrations, analytics and unrelated providers/schedules are outside A09. No external account configuration or email. |
| Acceptance | Review actual hosted schema/origin/auth/secure role access and import decisions; perform the six walkthroughs and manual AT/device checks. Earlier open owner/release gates remain. |

Inventory (read-only):

```sh
node --conditions=react-server --env-file=.env.local scripts/publications-import.mjs
```

After reviewing the mapping and the intended isolated target, use an existing publishing administrator UUID:

```sh
node --conditions=react-server --env-file=.env.local scripts/publications-import.mjs --apply --actor=EXISTING_PUBLISHING_ADMIN_UUID
```

This imports drafts. An explicit `--reviewed-published=slug-one,slug-two` may be used only for approved records on the intended nonlaunch review host; unlisted records stay drafts. It never republishes an existing imported row. Edit/publish existing drafts through the UI. No automatic build seed/import is added, and no hosted migration/import was manually run. Before launch, replace development content through normal factual/rights/editorial approval.

[Verification and owner walkthroughs](reviews/09-publications.md).
