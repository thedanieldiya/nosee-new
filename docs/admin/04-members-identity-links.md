# A04 — Private Members and explicit identity associations

**15 October 2026 · Implemented for branch review.** Based on main `4da6d4a` (merged A03 PR #19 / `27baf80`). The owner confirms A03 manual browser checks passed. This does not resolve unattended expiry scheduling, final privacy wording or Resend live setup. [Actual verification and owner walkthrough](reviews/04-members-identity-links.md).

**Current owner status (A05 handoff):** A04 merged through [PR #20](https://github.com/thedanieldiya/nosee-new/pull/20), implementation `fcab45d`. Owner checks passed **except pagination**, still pending owner verification. A05 adds automated 45-record/three-page/filter/navigation checks; those do not substitute for owner acceptance. Real profile linking remains dependent on A10. Original implementation verification below is historical; see [A05 operations](05-membership-emails.md).

## Contract and workflows

Super Admin only: `/admin/membership/members`, `/new` and `/[id]`; the detail's `?edit=1` opens its edit form. Membership secondary navigation connects Members and Applications. All pages, API reads/mutations and underlying services recheck authorization. Editors/Leads have no member, match, conversion or relation access. No scoped autocomplete/group management before A06.

| Field | Rules |
| --- | --- |
| First name / Last name | Required, trimmed, 1–80 printable characters each; Unicode supported |
| Email | Required, valid, trimmed/lowercased, ≤254 characters; unique across all member statuses |
| Phone | Optional printable text, ≤80 characters; no invented country/number format |
| Affiliation / institution | Optional printable text, ≤200 characters |
| Career stage | Optional for manual creation; exactly the A03 ordered choices |
| Research interests | Optional, zero to five unique A03 choices, shown alphabetically |
| Membership status | Required **Active/Inactive**; existing requirements specified no concrete states, so this is the minimum model authorized by the brief |
| Join date | Required real ISO calendar date (`YYYY-MM-DD`, years 0001–9999), not a timestamp; default is today's server UTC date; explicit date entry supported |
| Internal notes | Optional, ≤2,000 printable characters; line breaks allowed; private |

Active/Inactive describes membership only. It does not change application decisions, Better Auth roles/active flags/sessions, publish a person, or send email. There is no delete operation. Existing Member/application/audit history is retained; general retention remains a separate policy decision.

Directory search includes name, email and affiliation, with literal wildcard escaping, status/interest filters and stable 20-record pagination. Name/email lookup uses **Check possible matches** during create/edit; its private same-origin POST body keeps those lookup values out of the URL. Suggestions are up to ten case-insensitive partial first/last name matches, not an identity verdict. Distinct namesakes with different emails are allowed. Saving independently enforces normalized-email uniqueness even if the check is skipped/unavailable. No automatic merge/overwrite. Directory search itself retains the established authenticated GET-filter convention; avoid putting real personal data in shared URLs or unredacted access logs.

Manual creation requires a confirmation and persisted random creation-request UUID with canonical payload digest. Retrying identical input with the same key returns the existing record without duplicate creation/audit; changed input under that key conflicts. Edit/link requests include the last-read integer version; concurrent/stale writes fail with 409 and retain current data. Failed/ambiguous browser requests never claim confirmed success; creation can retry the same key, while stale edits require review of the current record.

## Approved application conversion

Only `approved` review shows **Create member**. The server also rejects pending/rejected/expired conversion, forged fields, missing confirmation and missing applications.

- New member conversion preserves the application's names, normalized email, career stage and interests; these prefills are read-only during conversion and checked against the original server record. Optional phone/affiliation, status, join date and new internal notes can be entered. Later explicit member editing is independent.
- Motivation, answers, consent, decision, reviewer and review note remain unchanged on the original application. Motivation is **never** silently copied into member notes. Member detail links back to its source application(s).
- An existing normalized email blocks new creation. The review screen identifies the existing member by name, email, affiliation, status and join date, with a link to full authorized detail. Confirmed **Associate existing member** is permitted only while the member version is current and its normalized email matches the approved application. Existing member fields/status/notes are untouched; the application's original career/interests stay available on its source record.
- A source application has at most one immutable member association. Repeated/concurrent conversion returns its already-associated member without new rows/audits; requesting another existing member conflicts. There is no reassignment/unlink shortcut. Multiple separately approved applications can reference a member where valid. Reusing a manual creation key cannot bypass explicit existing-member association.
- Conversion/association, member creation and safe audit events commit together under the existing management transaction lock. No partial Member is left after audit/association failure. Application detail shows the associated member afterward.

## Leadership relation and A10 boundary

Inspection found no persistent leadership model: About's `leadership.people` are explicitly unapproved code-managed fixtures. **None are imported.**

Migration `0003_members_identity_links.sql` adds an **empty** `leadership_profile_identity` table with stable UUID, display name, role/title, affiliation and timestamps. This is an identity anchor for A10, not a leadership CMS/content/publication model. A10 may extend it or attach its approved content model using those stable IDs. No profile create/edit/publish endpoint, fixture backfill, portrait/bio editor or public frontend query is added.

The member has an optional unique FK to that identity anchor. A member and profile may each exist independently; one profile cannot link to two members and one member cannot link to two profiles. Service/UI require explicit confirmation, current member version, an existing unassigned profile, and a separate unlink before replacement. Picker options disclose name/title/affiliation/ID to Super Admin only. There is no private-member reverse endpoint for Editors. A10 must preserve this privacy boundary.

With no real profiles, the picker and Link button are disabled and explain the A10 dependency. The reusable service/controls were tested with **isolated synthetic database identities only**; this is not a claim that live profile linking is operational. Linking/unlinking only changes the Member's FK/version and audit, never the profile's content, timestamps or visibility. The prepared picker returns up to 100 unassigned identities; A10 should add its real record selection/pagination when its inventory requires it. Research groups show an honest unavailable statement with no inert management controls.

## API/security and migration

All endpoints are private/no-store and use the existing signed-session, same-origin mutation, 8KB JSON, rate bucket and fresh active Super Admin/access-version checks. The typed Zod request schemas in `src/lib/membership/member-input.ts` are the machine-readable allowlists; no role/session/publication fields may be assigned.

| Endpoint | Methods / request |
| --- | --- |
| `/api/admin/membership/members` | GET directory query; POST `{fields,requestId,confirm:true}` |
| `/api/admin/membership/members/[id]` | GET detail; PATCH `{fields,version,confirm:true}` |
| `/api/admin/membership/members/matches` | POST `{firstName?,lastName?,email?,exclude?}`; Super Admin only |
| `/api/admin/membership/applications/[id]/member` | GET context; POST `{action:'create',fields,requestId,confirm:true}` or `{action:'associate',memberId,version,confirm:true}` |
| `/api/admin/membership/members/[id]/profile` | GET options; POST `{profileId:UUID|null,version,confirm:true}` |

Shared management advisory lock `4631002` orders authorization, CRUD, conversion and relation changes across instances. Application decisions use that same lock before their existing application lock; final approval cannot race conversion into an invalid state. Unique normalized-email, source-application primary key, unique optional profile FK and real FKs back service invariants. Version predicates protect edits/links. No public clock/role override or process-local authorization state.

Audits record real actor/time, generic Member/Application target IDs and safe status or association UUID before/after values. They never copy member email, names, phone, notes, applicant motivation/answers or provider secrets into payloads/logs. Application association records have their own actor/time; existing audit actor/history handling remains compatible.

**Owner migration:** review/apply **`drizzle/0003_members_identity_links.sql`** through the existing explicit `npm run admin:migrate` using the authorized isolated Preview database/direct operator connection. It adds only three new tables/indexes/constraints; no identity/session/invitation/application data alteration, automatic Member conversion, account bootstrap or profile backfill. Build/start never migrate. Retain the additive schema/history when rolling code back; do not drop populated member/application relations. No new environment variable, dependency or external service is required. Existing Preview `DATABASE_URL`, `BETTER_AUTH_SECRET` and exact `ADMIN_ORIGIN` remain; never rotate/reuse owner's credentials to perform tests.

Local test suites require the guarded disposable loopback `nosee_admin01_test` database and synthetic accounts; **never run them against Neon, hosted Preview or production**. Run mutating suites/browser checks sequentially. See [architecture](architecture.md) and [review](reviews/04-members-identity-links.md). Real A10 profile inventory, A06 groups, A05 membership mail, Resend live setup, unattended expiry schedule, final privacy text and broader public-release/manual AT gates remain separate.
