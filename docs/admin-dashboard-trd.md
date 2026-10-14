# NOSEE Admin Dashboard — TRD and Information Architecture

**Version:** 1.0 · **Status:** Approved by owner, 14 October 2026  
**Scope:** Authenticated administrative experience inside the existing Next.js application. **Specification only — no admin implementation is approved by this document.**  
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
| **Website** → Site content, Monitoring dashboards | Full | Editorial access | No access |
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

**Membership** — list/filter applications; privately review and approve/reject with recorded decisions; private member directory, create/edit/detail forms. Email notifications happen as a backend workflow; there is **no Email delivery page**.

**Research** — Super Admin sees group list and **Create group**. A group opens its public-page **Content** and group **Members**. **Edit research group** saves and publishes its frontend content; the group lead may do the same immediately. Members tab supports autocomplete of approved members, group-specific membership/role edits and removal.

**Publishing** — News, Events, Publications: list, create, edit, structured content, rich-text fields, inline image upload, preview, draft/publish/unpublish controls where suitable.

**Website → Site content** — a **secondary page-navigation sidebar** with:
- **Homepage:** Hero, Monitoring dashboards section, featured Research Outputs, Trending News, Upcoming Events. Edit designated copy/selection/configuration, not the original layout source.
- **About:** introduction, mission/objectives, quote, story, **Public profiles**, collaborations. Profiles are edited through About, **not Publishing**.
- **Gallery:** album directory, create/manage albums, multiple-photo upload, captions, alt text, album covers, sorting, visibility. An album can be associated with an event; no separate Media library.
- **Privacy policy:** rich-text editor, preview, publication control; actual policy text must receive appropriate approval.
- **Contact:** editable approved contact-page content.
- **Shared content:** public navigation/footer and any reused site strings.

**Website → Monitoring dashboards** — independent directory and per-dashboard configuration (name, description, approved provider/source, attribution, thumbnail, visibility/placement). **Scientific visualisations are special-purpose code/data components, not drag-and-drop generic rich-text blocks.**

**Settings → General** — current administrator's own first name, last name, profile image, email and account/security controls. It is **not** an organisation-configuration page.

**Settings → Administrators** — Super Admin directory, invitation/account status, access levels and scope assignments.

**Settings → Activity log** — Super Admin only; track important admin changes, publishing/member decisions and actors/times.

## 4. Identity, privacy, and media rules

- **Members and Public profiles are independent records.** A public executive/researcher need not be a member, and an approved member need not have a public profile.
- During manual member creation, application review or public-profile editing, detect possible name matches and show a small notification suggesting review. Confirm identity in a persistent dialog using only data the acting role is authorised to view; allow linking or remaining separate. **Never automatically merge, overwrite or publish.** Provide auditable unlinking.
- Editors may manage public profiles but cannot inspect sensitive member data as a side effect of match suggestions. Group Leads can use only approved-member autocomplete data necessary for scoped group association.
- Images upload **contextually** in the relevant editor. Keep storage/security/validation records internally but **do not expose a global Media library UI**.

## 5. UI and editor contract

- Use **Shopify account-settings** as the usability reference: narrow primary sidebar, occasional contextual secondary sidebar, restrained page titles, simple bordered form sections, consistent Save/Edit/Publish actions, dense-but-readable tables. Avoid blocky uppercase labels, verbose filler and decorative icons.
- Use NOSEE's existing green tokens and Ubuntu Sans / IBM Plex Sans, with shadcn/ui admin primitives.
- **MingCute is the sole general-purpose icon system for both admin and public website.** Prefer `@mingcute/react`; replace shadcn's generated default icon imports. Use icons mostly in the primary sidebar and a few necessary controls. **When an exact MingCute icon doesn't exist, choose the closest existing MingCute substitute. Do not invent icons or introduce a second icon pack.** Brand logos, diagrams, and ordinary photographic/scientific assets are not general-purpose UI icon-pack substitutions.
- **Icon and adjacent-text colour parity (owner requirement, 14 October 2026):** Use MingCute's default `currentColor`/CSS inheritance for all general-purpose icons. The icon beside a label, link, form field or button text must match **that neighbouring text's computed colour**, including normal, hover, active, focus and disabled states; icon-only controls inherit their parent control's text colour. Avoid hardcoded icon colours, independent opacity, `brightness`/`invert` hacks or unmatched stroke/fill. Keep contrast and accessibility. Verify the actual rendered states on dark/light surfaces.
- Replacing original public-site SVG/interface icons with MingCute requires a **separate approved, regression-tested change after the current strict Laravel port**. This TRD does not authorise breaking ongoing pixel parity.
- PlateJS is the preferred **free/open-source rich-text editor candidate**, subject to Next/React and licensed-component compatibility testing. Use structured fields for titles, dates, metadata, membership and scientific configurations rather than embedding everything in rich text.
- Inline image upload (including album multi-upload) must support drag/drop, image preview, server-side validation and durable storage. Exact storage provider/library remains an implementation decision, **not a confirmed purchase or integration**.

## 6. Approved Next.js App Router page tree

`(admin)` is a route group and does not appear in URLs. Shown entries are page destinations; supporting server actions, models, component files, schemas and tests live outside this tree.

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
            │       ├── page.tsx            # Publications
            │       ├── new/page.tsx
            │       └── [id]/page.tsx
            │
            ├── website/                    # Super Admin / Editor
            │   ├── site-content/
            │   │   ├── layout.tsx          # Secondary page sidebar
            │   │   ├── page.tsx            # Redirect to Homepage
            │   │   ├── homepage/page.tsx
            │   │   ├── about/
            │   │   │   ├── page.tsx
            │   │   │   └── profiles/
            │   │   │       ├── page.tsx    # Public profiles
            │   │   │       ├── new/page.tsx
            │   │   │       └── [id]/page.tsx
            │   │   ├── gallery/
            │   │   │   ├── page.tsx        # Albums directory
            │   │   │   └── albums/
            │   │   │       ├── new/page.tsx
            │   │   │       └── [id]/page.tsx  # Album and photos
            │   │   ├── privacy-policy/page.tsx
            │   │   ├── contact/page.tsx
            │   │   └── shared-content/page.tsx
            │   │
            │   └── monitoring-dashboards/
            │       ├── page.tsx            # Dashboard directory
            │       └── [id]/page.tsx       # Config/visibility
            │
            └── settings/
                ├── general/page.tsx        # All roles: own profile
                ├── administrators/page.tsx # Super Admin only
                └── activity-log/page.tsx   # Super Admin only
```

## 7. Implementation boundary

**Locked:** Page IA, navigation labels/placement, scoped role visibility, group-lead immediate publishing and fully editable group-members association tab, approved-member-only autocomplete, album-based Gallery, public profiles under About, General as own-account settings, no Operations/Email delivery/Media Library, shadcn with MingCute-only UI icons, and the clean Shopify-inspired direction.

**Implementation choices to validate later:** Auth/ORM/storage versions, precise admin-editor schema and media provider, email service configuration, legal text and content provenance. These do **not** reopen the approved IA.

**No code has been implemented by approval alone.** The current public Laravel-to-Next parity tasks and final source acceptance/cleanup remain a separate milestone. This spec guides the later dedicated admin/database/CMS phases.
