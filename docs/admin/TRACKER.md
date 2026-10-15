# NOSEE Admin Dashboard — Delivery Tracker

**Started:** 15 October 2026 · **Scope:** Owner-approved [Admin Dashboard TRD v1.2](../admin-dashboard-trd.md).  
**Baseline:** Public frontend migration and [Task 12 PR #12](https://github.com/thedanieldiya/nosee-new/pull/12) merged; **A01 foundation implemented on its review branch; hosted preview provisioning remains blocked**.
**Current task:** **A01 — Secure authentication, role-aware dashboard shell and interactive preview**. [Implementation brief](01-foundation.md).  
**Progress:** **0/13 admin tasks merged · 0/13 owner-approved interactive reviews.** A01 is implemented/In review; neither code tests nor screenshots count as owner approval or a hosted preview.

## Delivery and hands-on review tracker

| ID | Scope and user-visible result | Code status | Owner review | PR / branch | Interactive preview |
| --- | --- | --- | --- | --- | --- |
| **A01** | **First Super Admin CLI bootstrap + auth + shadcn shell + General:** create initial admin securely; sign in/out as each role, browse responsive navigation, edit and persist own name/profile fields | In review | **Preview blocked** — no hosted DB/env/accounts or verified URL; [review](reviews/01-foundation.md) | `codex/admin-01-foundation` (no PR) | Unverified; local PostgreSQL/role walkthroughs pass |
| A02 | **Administrators + Activity log:** Super Admin manages invited administrator roles/scopes and inspects genuine audited changes | Not started | Pending | — | — |
| A03 | **Membership applications:** submit a test application via approved public intake form, then privately review/approve/reject it | Not started | Pending | — | — |
| A04 | **Member records and identity links:** create/edit private Members; review suggested matches and explicitly link/unlink Leadership profiles without data leakage | Not started | Pending | — | — |
| A05 | **Transactional membership emails:** test acknowledgement, administrator alert, approval/rejection notification, retry/failure handling with isolated inbox/provider | Not started | Pending | — | — |
| A06 | **Research workspaces:** create/edit groups as Super Admin; as scoped Lead publish directly, add/remove **approved Members by autocomplete** and reject access to other groups | Not started | Pending | — | — |
| A07 | **News publishing:** create/edit/preview/publish News; homepage automatically shows featured then latest published articles (up to four) | Not started | Pending | — | — |
| A08 | **Events publishing:** edit real schedules, timezones, itinerary and links; homepage automatically shows featured upcoming events then fills up to three | Not started | Pending | — | — |
| A09 | **DOI-first Publications:** DOI metadata auto-fills editable fields; retry/manual correction; homepage Research Outputs shows latest three published | Not started | Pending | — | — |
| A10 | **Homepage Hero + Leadership profiles:** edit slides, create/manage public leadership profiles directly under Site content; About body remains code-managed | Not started | Pending | — | — |
| A11 | **Gallery:** upload standalone photo with required caption/alt; create albums, bulk-upload caption-optional photos and see generated album photo names | Not started | Pending | — | — |
| A12 | **Privacy policy + reserved Monitoring page:** preview/publish approved policy; Monitoring admin page stays empty with no CRUD; no Contact/Shared/About editor | Not started | Pending | — | — |
| A13 | **Integrated admin acceptance:** cross-role authorization, content/publish/revalidation, privacy, mobile/keyboard and deployment smoke checks; owner walkthrough | Not started | Pending | — | — |

**Status rules:** `Not started` → `In progress` → `Pushed/In review` → `Merged`. `Blocked` identifies unmet external setup or validation. **Owner review is independent**: `Pending`, `Preview blocked`, `Changes requested`, or `Approved`. A merged PR does **not** imply hands-on approval. Mark a task accepted only after the owner can test its applicable interactive behaviours or expressly waives that gate.

## Mandatory preview contract (every task, beginning A01)

1. **Working browser preview, not screenshots alone.** Push a dedicated task branch, obtain its **actual Vercel preview URL** if deployed (never invent one), and link it in the table. New changes must be usable, not inert placeholder forms, menus or fake Save messages. Review the actual branch code; no automatic PR/merge.
2. **Safe sign-in for owner testing.** Starting A01, provision **real, securely authenticated preview-only** Super Admin, Editor and scoped Research Group Lead accounts backed by an **isolated non-production database**. Give the owner account-access instructions **through a secure channel, never in Git, PR comments, screenshots or logs**. No global demo passwords, hardcoded role switcher, public signup or real applicant/member PII.
3. **Owner interaction script.** With each task, report 3–6 short actions the owner can perform (which account, route and visible expected outcome), plus mobile/desktop behaviour, working actions, role restrictions and any not-yet-implemented controls. Screenshots and short video captures are **supplementary evidence**.
4. **No preview = no verified interactive gate.** If Vercel checks/URL are unavailable (past CONNECT 403), report `Preview blocked` and the precise setup/permissions needed. A production-like local demo with documented secure setup may be offered, but screenshots or a guessed URL **do not** count as an owner-accessible hosted preview. Never bypass authentication or expose private data to make a demo work.
5. **Incremental and token-conscious.** Each task updates this table with verified branch/commit, PR link after the owner supplies or merges it, working preview URL, test/QA results, external blockers and actual review outcome. Store concise proof in `docs/admin/reviews/` and reusable tests under `tests/`; avoid giant screenshot/log directories. Run appropriate public-route regressions and ensure admin code/dependencies do not leak into public bundles.
6. **Preview infrastructure is an owner-approved prerequisite, not automatic provisioning permission.** A01 must identify the Vercel preview environment, database/storage needs, safe preview-account provisioning and owner actions. It **must not change production settings or purchase services without permission**. Fail closed if auth/database cannot be safely configured.

## Milestone boundaries and exclusions

- **A01** is intentionally narrow: **one-time, server/CLI-only first Super Admin bootstrap** (interactive masked password prompt, refusal after first admin, no public signup), real admin auth, roles, page shell, Overview, Settings → General, and the working review experience. Other sidebar modules may indicate that they are planned, but must not pretend their forms/data are operational.
- **A03–A05** need owner-approved membership form fields, consent/retention copy, email provider and recipient configuration before public intake/email goes live. Applications are **not** dashboard accounts.
- **A06** only associates existing **approved NOSEE Members** to research groups. Group Leads edit and publish their own group's Content and Members immediately. Editors cannot read private member records.
- **A07–A09** implement CMS and homepage feed rules from TRD v1.2. New public News/Publication detail/listing pages require separately approved public-page scope/design/content (P4); do not publish invented copy or remove `noindex` just because a CMS editor works.
- **A10–A12** implement **only** the approved editable Website pages. Public About copy, Contact/Shared content, and Monitoring dashboards remain hardcoded; the reserved Monitoring admin page has **no editor**.
- The separate [public-release checklist](../PUBLIC-SITE-STATUS.md) (manual screen reader, live launch, accurate organisation content/rights, public indexing, eventual ≤2.5s LCP) remains open and does not block the approved admin build unless a security or operational dependency actually requires it.

## Review log

| Date | Milestone | Update / owner decision |
| --- | --- | --- |
| 2026-10-15 | A01 ready | Admin TRD v1.2 and [A01 implementation brief](01-foundation.md) approved as direction; 0/13 code tasks merged. Added **hands-on preview as an explicit requirement** before interactive owner acceptance. |
| 2026-10-15 | A01 implemented/In review | Real PostgreSQL/auth/bootstrap, role shell and General; 116 unit/public + 15 integration cases, responsive/axe/public checks. Hosted provisioning and owner walkthrough remain blocked; no approval or A02. |

**Canonical docs:** [Admin TRD v1.2](../admin-dashboard-trd.md) · [Admin 01 brief](01-foundation.md) · [Delivery progress](../PROGRESS.md) · [PRD](../PRD.md).
