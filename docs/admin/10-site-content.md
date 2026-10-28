# A10 — Homepage hero and Leadership profiles

**28 October 2026 · Production candidate, in review.** Branch `codex/a10-site-content` starts from main `2d22934`, containing A09 PR #32. A09 is merged; **core merged progress is 9/13**. A08/A09 owner walkthroughs and live DOI verification remain pending. No A10 merge or owner acceptance is inferred.

## Scope and model

Website → Site content redirects to Homepage, with contextual Homepage/Leadership navigation and Gallery/Privacy explicitly planned. Super Admin and Editor manage content; Leads and anonymous callers are denied at pages, APIs and current-authority transactions. There is no general About, Contact, shared-content or Monitoring editor. News, Events and Publications keep their automatic homepage rules.

The hero is one ordered working collection plus one published snapshot. Saving initializes an editable collection from the **two exact current slides**, preserving copy, IDs, image references, credit and existing CTA destinations. The first draft save retains the exact legacy published hero. Subsequent working edits, reorder and confirmed removal affect only the working collection. Publication atomically replaces the whole collection and requires 1–12 valid slides. A single slide has no indicators; multiple slides reuse the existing carousel/autoplay/reduced-motion/image-decode behavior. Image-free new slides use the hero's green background beneath its existing dark overlay.

Slide fields: eyebrow 100, title 240, summary 1000, image alt 400, image credit 500, CTA label 80 and URL 2048 characters. A label/URL pair is optional but must be complete; URLs allow safe root-relative or HTTP(S) destinations, with credentials, backslashes and unsafe schemes rejected. Retained images are checked by slide ID against its working/live ownership; a new slide cannot borrow an unrelated asset. There is no image URL input, repository asset picker, upload control or fake upload success.

Leadership content attaches **one-to-one to the existing `leadership_profile_identity.id`**. Migration 0013 adds an identity tombstone and a content table; any existing A04 identity is attached as a **draft**, preserving its ID/name/role/affiliation. It does not create members, accounts, facts or publications. New content stores first/last name and optional unsplit display-name override, role/title, optional executive/researcher category, affiliation, editor-entered research interests, safe rich biography (6,000 visible characters), retained portrait/alt and integer display order (0–9999). New profiles use a neutral portrait placeholder. No arbitrary image references or deferred upload setup is offered.

Profiles use current fields for draft/direct publication, private saved preview, canonical saved-revision indicators, publish changes, unpublish/republish and exact `Delete {display name}` confirmation at the bottom of Edit. Display order ties use stable profile IDs. Working biography fields do not enter directory client payloads. Safe rich rendering shares the existing allowlist/editor and canonical rich-document comparison. System timestamps use WAT. Mutation IDs, optimistic versions, dirty-exit Keep/Discard/Save, private no-store responses and shared success/error/warning toasts follow News/Events/Publications conventions; no periodic autosave.

## Identity and privacy

The real Member → Leadership picker is available to Super Admins, searches name/role/affiliation and returns up to 100 eligible nondeleted identities with distinguishing public metadata/IDs. A profile's Super Admin-only association section searches up to 20 eligible existing members by name/email/affiliation. Both entry points use the **existing A04 `linkMemberProfile` service**, explicit confirmation and current member versions. One-to-one constraints and the shared transaction/authority lock serialize linking, profile deletion and member changes. No name/email auto-merge or private-to-public field copying occurs. Public-profile namesakes are suggested during addition without automatically linking them.

Editor profile responses contain only content/status/version/timestamps, without member IDs, counts, matches or association flags. Editors cannot call the private association search. Linking changes only the member relation/version and audit, so it does not reveal association events through profile timestamps or publication flags. Editors may delete unlinked profiles; blocked deletion returns only “Contact a Super Admin to complete this deletion.” Super Admin deletion atomically tombstones the identity/content, detaches the relation, advances the member version and retains the member's other fields/status/history. Member deletion continues to preserve public profile content. Deleted IDs cannot be edited, republished or relinked. Audits retain safe actions/IDs/order/status, not biographies or private member answers/notes.

## Explicit public transition and failure behavior

Before initialization, a **successful empty-table read** retains the exact two hero slides and seven explicitly marked development leadership placeholders. Saving/initializing hero content establishes its permanent snapshot; there is no later fixture fallback. About keeps its original development presentation while profile drafts are prepared. **First explicit profile publication** switches About to published snapshots atomically, as the editor/directory explain. A confirmed “Use published profiles on About” action also supports an intentional empty cutover. Once that marker exists, unpublish/delete/empty collections never restore placeholders.

Non-leadership About copy/layout remains code-managed. Published profiles reuse its existing square portraits, typography, spacing and carousel; optional biography/affiliation/interests appear as public content. The obsolete development-placeholder introduction is hidden after cutover. Hero/profile indicators now have 24px touch targets around the unchanged 12px/8px visible dots; their small horizontal spacing change is an explicit accessibility exception. Existing legacy collection heights are retained, and large profile collections wrap indicators safely. The profile offset calculation is relative to the first slide, correcting inherited container-offset clipping of names/portraits. These are documented accessibility/compatibility exceptions inside the affected carousels. Empty collections show a truthful empty state; missing portraits use a neutral square. Database failure or missing configuration shows unavailable/neutral content, while other homepage/About sections remain readable. Neither case restores fixtures. Builds do not seed, initialize, import or publish data.

The two hero items come verbatim from `content/homepage.php` at the pinned Laravel source, now `src/lib/content/homepage.ts`. The seven people in `src/lib/content/about.ts` are **unapproved development placeholders**, with scientific stand-in images rather than verified people/portraits and no invented biographies/affiliations. Their deterministic optional mapping preserves only existing facts/assets and imports **drafts**, never automatically approves or publishes them. Existing imported edits/tombstones are retained on repeat. The old hero AGM destination remains the inherited deferred missing route; A10 does not fabricate its content.

Inventory only:

```sh
node --conditions=react-server --env-file=.env.local scripts/site-content-initialize.mjs
```

After reviewing the mapping and intended isolated target, initialization may use an existing publishing administrator UUID:

```sh
node --conditions=react-server --env-file=.env.local scripts/site-content-initialize.mjs --apply --actor=EXISTING_PUBLISHING_ADMIN_UUID
```

An explicit additional `--draft-profiles` imports the seven development profiles as drafts, retaining their existing scientific images. It never switches About or republishes existing/deleted records. Normally add approved real profiles through the UI instead. No live command was run.

## Setup register

| Area | Implemented / remaining |
| --- | --- |
| Schema | Additive 0013: stable-identity tombstones, attached profile content/draft backfill, hero singleton and irreversible-by-normal-workflow leadership cutover marker. Existing automatic migration convention remains unchanged. Agent commands target only disposable loopback fixtures. |
| Content readiness | Original hero/legacy presentation preserved until initialization/cutover; factual accuracy and original missing CTA destinations remain owner gates. Profiles/biographies/portraits require editorial/rights approval. |
| Real identity picker | Implemented at both Super Admin entry points using A04 stable IDs/services. Hosted cross-role/private-data acceptance remains open. |
| Uploads/services | Durable hero/portrait uploads remain deferred. No storage provisioning, temporary upload, service configuration, account creation or email. |
| Owner acceptance | Verify intended Preview migration/origin/auth/isolated role access; complete the six review flows and manual AT/device review. Earlier A08/A09/live DOI and unrelated release/setup gates remain pending. |

[Validation, actual preview status and six owner walkthroughs](reviews/10-site-content.md).
