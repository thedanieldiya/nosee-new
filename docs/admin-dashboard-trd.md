# NOSEE Admin Dashboard — TRD and Information Architecture

**Version:** 1.2 · **Status:** Approved information architecture; editorial scope and field workflows revised 14 October 2026  
**Owner correction (15 October 2026):** [A05.5](admin/05-5-membership-workflow.md) supersedes the separate application-to-member conversion/manual lookup flow. Approval atomically establishes Active membership, with explicit existing-member/reactivation acknowledgement. No administrator access/public publication.
**Owner A06.5 correction (15 October 2026):** research editors use automatic hidden stable slugs, generated cover alt, safe rich descriptions and typed Super Admin group deletion. New uploads are deferred; existing references/history remain. The automatic stable slug convention also governs future publishing editors; it supersedes manual slug wording below without rewriting established public routes. [Current contract](admin/06-research-groups.md).

**Owner A06 refinement (15 October 2026):** [Research groups](admin/06-research-groups.md) adds explicit Active Member/real-group-bound Lead identity and membership-driven scope revocation while retaining separate administrator accounts. Public research rendering/design and new image uploads remain identified dependencies, not implied existing pages/services.

**Scope:** Authenticated administrative experience inside the existing Next.js application. **Documentation scope only — changes in this TRD do not by themselves implement admin features or change public pages.**  
**Visual direction:** Shopify account-settings dashboard — quiet, clear, compact labels, restrained form panels and actions.  
**Public-site constraint:** Original Laravel public-page parity remains separate; no changes to ongoing public migration are authorised here.

## 1. Purpose and stack

One private workspace for organisation membership, research-group management, editorial publishing, and website content. Keep it in the existing Next.js App Router + TypeScript + Tailwind app, with branded **shadcn/ui** components. PostgreSQL/auth/storage/editor integration must be selected and verified during later implementation, rather than assumed operational.

Core principles:
- A page appears where an administrator expects to work with it, not wherever the database stores its records.
- Protect private membership information and publishing actions with **server-side role and record-scope authorization**, not sidebar hiding alone.
- Native, validated forms and direct editing; draft/preview/publish as applicable. A group lead has direct publishing permission within their assigned group.
- No generic drag-and-drop website page builder. Website layouts are code-owned; content fields are safely editable.
- No standalone Operations, Email delivery, Organisation details or Media library navigation.

## 2. Roles and navigation

| Destination | Super Admin | Editor | Research Group Lead |
| --- | --- | --- | --- |
| **Overview** | Organisation-wide | Publishing/website tasks | Assigned research group |
| **Membership** → Applications, Members | Full access | No access | No access |
| **Research** → Groups, group Content/Members | All groups; create/edit | No access | Assigned group only; edit and publish both Content and group Members |
| **Publishing** → News, Events, Publications | Full | Full editorial access | No access |
| **Website** → Site content (Homepage, Leadership profiles, Gallery, Privacy policy), Monitoring dashboards (reserved) | Full | Editorial access | No access |
| **Settings** → General | Own account | Own account | Own account |
| **Settings** → Administrators | Full | No access | No access |
| **Settings** → Activity log | Full | No access | No access |

- **Editor sees only Overview, Publishing, Website and Settings → General.**
- **Research Group Lead sees only scoped Overview, their assigned Research group and Settings → General.** The `/admin/research` entry directs them into their assigned group; other group IDs must be inaccessible even by a direct URL/API/server action.
- Super Admin can create groups and manage administrators and the Activity log.
- Group Lead has **full editing of their assigned research group's Members tab**: search/select, add/remove approved NOSEE members, and manage group-specific member associations/roles. They cannot create a new person from the group workspace or change private organisation-wide member records.
- Any content change by a permitted Research Group Lead can be **published immediately, without approval**. Record actor/time in an audit trail.
- All research-group members **must already be approved NOSEE members**. Add Member is autocomplete-only from eligible member records, with identity-disambiguating results. No manual entry, new-member form or external collaborators in this workflow.
- Membership applications do not create dashboard accounts. Approving a member does not automatically publish a public profile.

## 3. Key destinations and editing flows

**Overview** — role-specific actionable summary (applications/drafts/events for Super Admin; editorial tasks for Editor; group tasks for Lead). No fabricated metrics.

**Membership** — the public **`/join`** form (to be implemented in **A03**, outside `/admin`) accepts membership applications; Super Admin privately lists/filters, reviews and approves/rejects them with recorded decisions. The member directory has Add/Edit/detail forms. Add/Edit and approval match checks are automatic; there is no manual lookup button. Applications remain private and **pending** until reviewed, do not grant login access or automatically publish a public profile. Email notifications happen as a backend workflow; there is **no Email delivery page**.

**Approval correction — A05.5:** Successful approval, Active member addition/safe acknowledged association, application link, audits and notification intent commit together. Matching normalized email requires current-version acknowledgement; Inactive membership additionally requires confirmed reactivation while preserving profile fields/original join date. Replays return the same result. New approvals show the associated Member immediately. Historical approvals without a link retain contextual **Add member** reconciliation without duplicate approval email. Optional data is not invented; no member notes from application/review answers.

**Research** — Super Admin sees group list and **Create group**. A group opens its public-page **Content** and group **Members**. **Edit research group** saves and publishes its frontend content; the group lead may do the same immediately. Members tab supports autocomplete of approved members, group-specific membership/role edits and removal.

**Publishing** — News, Events, Publications: list, create, edit, structured content, rich-text fields, inline image upload, preview and publishing controls. Publications begin with a **DOI lookup**, which fills available citation metadata without locking fields against correction.

**Website → Site content** — a **secondary page-navigation sidebar** with **only**:
- **Homepage:** edit hero slides and their links/images/copy. **News, Events and Research Outputs populate automatically** from published records; there are no homepage pickers for these sections. The Monitoring dashboards display remains hardcoded.
- **Leadership profiles:** a direct page under Site content (not nested under About), with a list plus create/edit screens for the people shown in the public About page's leadership area. The rest of the **About page remains hardcoded**; no About content editor. Profiles may exist without membership records.
- **Gallery:** manage both **standalone photographs** (required caption, also used as alt text) and **albums** (multiple photos, no required per-photo caption). Album photo names are generated as `[Album name] - 1`, `[Album name] - 2`, etc.; images can be reordered. Optional Event association and cover photo remain available.
- **Privacy policy:** rich-text editor, preview and publication control; actual legal text requires approval.

**Website → Monitoring dashboards** — **reserved, empty administration page only**. The current public monitoring cards/dashboard section and scientific visualisations remain **hardcoded**. Do not build dashboard CRUD, a resource editor or a generic scientific page builder now.

**No Website → Contact, Shared content or About editor.** Public About text, contact details, navigation, footer and shared site copy remain code-managed until separately approved.

**Settings → General** — current administrator's own first name, last name, profile image, email and account/security controls. It is **not** an organisation-configuration page.

**Settings → Administrators** — Super Admin directory, invitation/account status, access levels and scope assignments.

**Settings → Activity log** — Super Admin only; track important admin changes, publishing/member decisions and actors/times.

### 3.1 Forms and editors — initial field inventory

The following are the **initial editable fields**, not a mandate to add every field to a single screen. Existing News, Events, Publications and Homepage hero models inform these fields; public About copy, Contact/shared content and Monitoring dashboards remain code-owned. New membership/research/gallery fields are proposed for implementation review. **Directory/Overview pages are primarily lists, filters and actions, not editing forms.**

| Page / form | Fields and controls |
| --- | --- |
| **Public `/join` + Membership → Application review** | **Public `/join`:** applicant details (minimum first name, last name, email; further fields and consent/retention copy require owner approval before build), server-side validation, duplicate/abuse protection and truthful submission acknowledgement. Save an applicant record as private **pending**, never an admin login or approved Member. **Admin review:** the submitted fields are read-only; Super Admin can **Approve / Reject** with internal review note/reason. Submission date, status and reviewer are system records. Show possible-person matches only to authorised reviewers. |
| **Membership → Add / Edit member** | First name, last name, email; optional phone, affiliation/institution, research area(s), membership status, join date and internal notes. Show group associations and an optional **linked leadership PublicProfile record** with a confirmation/unlink workflow; don't edit its public fields here. |
| **Research → Create / Edit group** | Group name, URL slug, short introduction, full description, objectives/focus areas (repeatable), cover image and alt text, visibility/publication status; **assigned Group Lead** (Super Admin only, selected from eligible accounts). Edited content updates the corresponding public group page. |
| **Research → Group Members** | **Approved-member autocomplete only** (select an existing Member), group-specific member role/title and optional display order; remove membership association. No manually typed person, new-member form or unapproved applicant. Group Leads can edit all of these for **their assigned group only** and publish immediately. |
| **Publishing → News editor** | Title, slug, category, excerpt/summary, article body (**rich text**), cover image and alt text, publication date, featured flag and Draft/Published status. |
| **Publishing → Event editor** | Title, slug, event type, summary, body (**rich text**), image/alt, organiser, speakers (repeatable); timezone, start/end dates, single-/multi-day schedule and start/end times; optional itinerary days (date, time, title, description); location type (physical/online/hybrid), venue/address/city/country/platform; application deadline, registration URL, meeting-site URL (for meeting type), resources (label + URL), featured flag and status. Conditional sections only appear for applicable event types. |
| **Publishing → Publication editor** | **DOI is the first field.** When a valid DOI is entered/pasted (on blur or a short debounce), securely fetch available citation metadata from a supported provider (for example Crossref or DataCite) and populate title, authors, publication type, date, journal/conference/source and reference URL where supplied. Show loading/no-match/error and allow retry or full manual entry. **Every populated field remains editable**, and subsequent lookups must not silently overwrite user corrections. Other fields: automatic stable slug, research area/group, publication status. No homepage Featured flag is needed: Research Outputs uses the latest three published records. |
| **Website → Site content → Homepage** | **Hero slides only:** eyebrow, title, summary, image, alt text, image credit, CTA label + URL and ordering. No manual News/Event/Research selection fields; see automatic rules below. The Monitoring dashboards section is code-managed. |
| **Website → Site content → Leadership profiles** | First name, last name/display name, role/title, profile category where applicable (executive/researcher), optional affiliation/research interests, biography, portrait/alt, display order and publication status. Optional permission-safe **linked Member** identity review; a leadership profile can exist without membership. No general About content editor. |
| **Website → Gallery → Standalone photo** | Single image upload; **caption required**, and that same caption is used as the public image's **alt text**. Optional order and publication visibility; replace/remove actions. No album required. |
| **Website → Gallery → Album** | Album name/title, optional description, optional linked Event/date, cover image (chosen from uploaded photos), album order and publication visibility; add/reorder/remove multiple photos. |
| **Website → Gallery → Album photos** | Batch upload. Automatically assign photo names `[Album name] - 1`, `[Album name] - 2`, etc. **Captions are not required** (optional if entered); when an album photo has a caption, **reuse it as alt text**. For uncaptioned album images, allow an optional descriptive alt text; the generated photo name is a label, not a factual description of the image. Maintain stable identifiers and sensible numbering after reordering/removal. |
| **Website → Privacy policy** | Page title, approved policy body (**rich text**), effective date and publication status. Version/last-update information remains a system record. Legal approval is required before public publication. |
| **Website → Monitoring dashboards** | **No editable fields yet.** This is a reserved, empty destination; public monitoring dashboards stay hardcoded and the admin editor will be designed later. |
| **Settings → General** | Own first name, last name, email, profile photo and account-security/password controls. No organisation-wide settings. |
| **Settings → Administrators** | Invite/modify administrator: first name, last name, email, access role (**Super Admin, Editor or Research Group Lead**), and assigned research group for a Lead. Invitation status and last login are read-only; revoke/deactivate is an explicit action. |
| **Settings → Activity log** | **No edit form.** Super Admin can filter by date range, actor, action and affected record; details include timestamp, action, target and safe before/after summary where available. |

**Shared form rules:** Validate required names/titles, unique slugs, DOI format, URLs, dates and uploaded image formats/sizes server-side. DOI retrieval must be server-mediated, restricted to trusted metadata providers, with sensible timeouts/rate limits; incomplete provider data must not be invented. Editors can correct imported citation fields and save a publication manually when a DOI cannot be resolved. Auto-generated record IDs, album-photo names, timestamps, audit actors and calculated event status are not treated as public editorial input. Use contextual image upload; for **standalone gallery items the required caption is the alt**, while album-image caption is optional. Publishing and previews must respect role/scope authorization; replacing development fixtures requires approved real content. Final required/optional flags and consent language are set with each implementation without reopening the approved navigation tree.

### 3.2 Homepage collection rules (automatic, not manually curated)

- **Events (up to 3):** eligible published **upcoming** events, prioritising featured upcoming records (nearest start date first) and filling remaining slots with the next upcoming events by start date. **Typical case: 1 featured + 2 other upcoming; if none featured: 3 upcoming.** No duplicates; never show past/unpublished events merely because they are featured.
- **News (up to 4, matching the existing layout):** prioritise featured **published** articles, then fill remaining places with the latest published articles by publication timestamp. No manual homepage picker and no duplicate article.
- **Research Outputs (3):** the **three latest published publications/research outputs**, ordered by publication date descending. Featured state does **not** affect this homepage section.
- **Monitoring dashboards:** hardcoded frontend display for now. No administrator-configured cards, ordering or live scientific dashboards in this phase.

These are **future database/CMS-connected homepage rules**. The existing literal Laravel migration/fixture output is not to be silently altered by a documentation-only change.

## 4. Identity, privacy, and media rules

- **Members and leadership Public profiles are independent records.** A public leadership profile may exist without membership, and an approved member need not have a public leadership profile. The public About page is code-managed except for its leadership-person collection.
- During manual member addition and application review, automatically check possible names/email with debouncing and stale-response cancellation; leadership-profile matching follows its later approved implementation. Detect possible name matches and show a small notification suggesting review. Confirm identity in a persistent dialog using only data the acting role is authorised to view; allow linking or remaining separate. **Never automatically merge, overwrite or publish.** Provide auditable unlinking.
- Editors may manage public profiles but cannot inspect sensitive member data as a side effect of match suggestions. Group Leads can use only approved-member autocomplete data necessary for scoped group association.
- Images upload **contextually** in the relevant editor. Keep storage/security/validation records internally but **do not expose a global Media library UI**.

## 5. UI and editor contract

- Use **Shopify account-settings** as the usability reference: narrow primary sidebar, occasional contextual secondary sidebar, restrained page titles, simple bordered form sections, consistent Save/Edit/Publish actions, dense-but-readable tables. Avoid blocky uppercase labels, verbose filler and decorative icons.
- Use NOSEE's existing green tokens and Ubuntu Sans / IBM Plex Sans, with shadcn/ui admin primitives.
- **MingCute is the sole general-purpose icon system for both admin and public website.** Prefer `@mingcute/react`; replace shadcn's generated default icon imports. Use icons mostly in the primary sidebar and a few necessary controls. **When an exact MingCute icon doesn't exist, choose the closest existing MingCute substitute. Do not invent icons or introduce a second icon pack.** Brand logos, diagrams, and ordinary photographic/scientific assets are not general-purpose UI icon-pack substitutions.
- **Icon and adjacent-text colour parity (owner requirement, 14 October 2026):** Use MingCute's default `currentColor`/CSS inheritance for all general-purpose icons. The icon beside a label, link, form field or button text must match **that neighbouring text's computed colour**, including normal, hover, active, focus and disabled states; icon-only controls inherit their parent control's text colour. Avoid hardcoded icon colours, independent opacity, `brightness`/`invert` hacks or unmatched stroke/fill. Keep contrast and accessibility. Verify the actual rendered states on dark/light surfaces.
- The already-authorised public MingCute migration has been handled separately; subsequent admin work must keep the public interface unchanged unless the owner explicitly approves a new change.
- PlateJS is the preferred **free/open-source rich-text editor candidate**, subject to Next/React and licensed-component compatibility testing. Use structured fields for titles, dates, metadata, membership and scientific configurations rather than embedding everything in rich text.
- Inline image upload (including album multi-upload) must support drag/drop, image preview, server-side validation and durable storage. Exact storage provider/library remains an implementation decision, **not a confirmed purchase or integration**.

## 6. Approved Next.js App Router page tree

`(admin)` is a route group and does not appear in URLs. Shown entries are page destinations; supporting server actions, models, component files, schemas and tests live outside this tree. **The public `/join` route is a separate future public page (e.g. `src/app/(public)/join/page.tsx`), not part of this admin route tree; A03 implements it alongside application review.**

```text
src/
└── app/
    └── (admin)/
        └── admin/
            ├── layout.tsx
            ├── page.tsx                    # Overview
            │
            ├── membership/                 # Super Admin
            │   ├── applications/
            │   │   ├── page.tsx            # Applications
            │   │   └── [id]/page.tsx       # Review application
            │   └── members/
            │       ├── page.tsx            # Member directory
            │       ├── new/page.tsx        # Create member
            │       └── [id]/page.tsx       # Member details/edit
            │
            ├── research/                   # Super Admin / scoped Lead
            │   ├── page.tsx                # All groups; Lead redirects to assigned
            │   ├── new/page.tsx            # Create group (Super Admin)
            │   └── [groupId]/
            │       ├── page.tsx            # Group content and overview
            │       ├── edit/page.tsx       # Edit/publish group
            │       └── members/page.tsx    # Manage approved group members
            │
            ├── publishing/                 # Super Admin / Editor
            │   ├── news/
            │   │   ├── page.tsx            # Articles
            │   │   ├── new/page.tsx
            │   │   └── [id]/page.tsx
            │   ├── events/
            │   │   ├── page.tsx            # Events
            │   │   ├── new/page.tsx
            │   │   └── [id]/page.tsx
            │   └── publications/
            │       ├── page.tsx            # DOI-first publications
            │       ├── new/page.tsx
            │       └── [id]/page.tsx
            │
            ├── website/                    # Super Admin / Editor
            │   ├── site-content/
            │   │   ├── layout.tsx          # Secondary page sidebar
            │   │   ├── page.tsx            # Redirect to Homepage
            │   │   ├── homepage/page.tsx   # Hero editing only
            │   │   ├── leadership-profiles/
            │   │   │   ├── page.tsx        # Leadership directory
            │   │   │   ├── new/page.tsx
            │   │   │   └── [id]/page.tsx   # Leadership profile editor
            │   │   ├── gallery/
            │   │   │   ├── page.tsx        # Standalone photos + albums
            │   │   │   ├── photos/
            │   │   │   │   ├── new/page.tsx
            │   │   │   │   └── [id]/page.tsx # Standalone photo editor
            │   │   │   └── albums/
            │   │   │       ├── new/page.tsx
            │   │   │       └── [id]/page.tsx # Album and photos
            │   │   └── privacy-policy/page.tsx
            │   │
            │   └── monitoring-dashboards/
            │       └── page.tsx            # Reserved empty page; no CRUD
            │
            └── settings/
                ├── general/page.tsx        # All roles: own profile
                ├── administrators/page.tsx # Super Admin only
                └── activity-log/page.tsx   # Super Admin only
```

## 7. Implementation boundary

**Locked:** Page IA and role/scope permissions; immediate group-lead publishing and approved-member-only group autocomplete; **DOI-first editable publication autofill**; **automatic homepage News/Events/latest-three Research Outputs**; **Leadership profiles directly under Site content** (About copy hardcoded); **standalone-captioned photos and caption-optional albums**; **Privacy policy**; empty reserved Monitoring dashboards admin destination (public display hardcoded); **no Contact/Shared content/About editors**, Operations/Email delivery/Media Library; General is own-account settings, with shadcn/MingCute-only Shopify-inspired design.

**Implementation choices to validate later:** Auth/ORM/storage versions, DOI metadata provider and fallback handling, precise admin-editor schema/media provider, email service configuration, legal text and content provenance. These do **not** reopen the approved IA.

**This specification change does not implement application features or rewrite the current public frontend.** The public-port close-out and the later admin/database/CMS implementation remain separately reviewed milestones.
