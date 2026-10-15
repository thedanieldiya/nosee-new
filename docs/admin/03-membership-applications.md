# A03 — Public applications and private review

**15 October 2026 · Merged in PR #19; owner confirms manual browser checks passed. This is not public-launch approval; unattended expiry scheduling/final privacy/Resend live setup remain pending.** Owner-supplied A03 requirements and the subsequent explicit-consent direction govern this task. Based on main `bf0d72e`, including Resend PR #18 (`1204b06`); [actual verification and walkthrough](reviews/03-membership-applications.md). No paid service or new dependency.

## Public contract

`/join` uses the existing public shell, fonts, colours and responsive container. Existing Join links already point here. `/privacy` is the existing footer destination, now explicitly labelled as a **development-only Lorem ipsum placeholder awaiting approval**. The form warns to use test information until the final policy is published. Noindex/prelaunch restrictions remain.

All fields are required and validated on the server:

| Field | Rules |
| --- | --- |
| First name / Last name | Trimmed, 1–80 printable characters each; Unicode supported |
| Email | Valid address, at most 254 characters, trimmed/lowercased for duplicate matching; not verified |
| Career stage | One approved value, in this order: High school student; Undergraduate student; Graduate/Postgraduate student; Postdoctoral researcher; Early career (<10 years); Mid-career (10–20 years); Experienced (>20 years); Retired |
| Research interest areas | One or more unique approved choices, alphabetically: Atmosphere and Air Quality; Climate Science; Earth and Space Informatics; Energy, Resources and Environment; Space Weather |
| Why do you want to join NOSEE? | Trimmed, 1–2,000 printable characters; line breaks allowed |
| Review-purpose consent | Unchecked by default, explicit affirmative value required in both browser and server validation |

Consent wording **`membership-review-v1`**: “I agree to NOSEE using the information I provide to review my membership application.” The server stores its own consent timestamp and wording version plus **`development-placeholder-v1`** as the current privacy-text version. Applicants cannot supply/forge these metadata. This is purpose-specific consent, not a claim that Lorem ipsum is meaningful approved policy. The owner will replace policy text later; review/update its version and consent wording deliberately when that happens. Legal basis, final privacy wording and retention remain launch requirements.

The real receipt appears only after the transaction commits. It states that the application was received for review, no account/membership is granted, no email is sent at this stage, and pending expiry does not delete data. Native forms work without JavaScript, with server validation and retained submitted values on error. Unconfigured/unreachable infrastructure disables the form or reports unconfirmed failure; it never fabricates success.

## Data, security and states

Migration **`drizzle/0002_membership_applications.sql`** adds the private application table, status enum, decision invariants, active-email uniqueness, unique form digest and expiry/created indexes. It makes audit actor nullable for genuine System events; existing administrator identities, credentials, sessions, bootstrap marker, invitations and audit records are preserved. No destructive backfill or live migration. Apply through the existing explicit `npm run admin:migrate` only after owner review, using the intended authorized direct connection. Build/start never migrate. Existing administrative code tolerates the new table/nullable actor through the updated LEFT JOIN. Roll back application traffic/code first; never drop real application or audit history as a shortcut.

| Current state | Allowed transition |
| --- | --- |
| No active application for normalized email | New separate `pending` record |
| `pending` before deadline | Super Admin → `approved` or `rejected`, with mandatory internal note, reviewer and server decision time |
| `pending` at/after deadline | System → `expired`; no decision allowed |
| `approved` | Final; blocks another active application; available for A04 |
| `rejected` / `expired` | Final for that record; a fresh application is allowed without overwriting history |

Deadline = submission timestamp + **720 elapsed hours**, using PostgreSQL timestamps with timezone. A decision evaluates `clock_timestamp()` **after acquiring the transaction lock**, so a waiting transaction cannot use a stale start time to approve an overdue record. One lock serializes submissions, decisions and expiry across app instances; private operations first recheck current active Super Admin/access version through the existing management lock. System receipt/expiry events have no fake administrator. Audit payloads contain generic record ID/type/label and status changes, never applicant email, answers, review notes, consent token or other submission data. Notes remain on the authorized application detail.

Same-origin checks, a hidden honeypot, a two-hour HMAC-signed random form nonce and canonical payload digest guard submissions. Exact-payload retries with the same nonce are idempotent; nonce reuse with altered fields conflicts. A partial unique lowercased-email index backs the serialized pending/approved duplicate check. Shared PostgreSQL rate buckets: 60 submission attempts/minute globally and five/hour per normalized email; on Vercel only, the platform-supplied valid `x-vercel-forwarded-for` adds 20/hour per IP. Untrusted forwarded headers do not alter email limits. Server Actions are capped at 32KB; review JSON uses the existing 8KB bound. Rate counters are not an indefinite retention policy; revisit abuse/retention controls before public scale.

`/admin/membership/applications` and `/[id]`, their APIs and underlying query/mutation services enforce Super Admin authorization. Editors/Leads cannot read application data or decide it through direct URLs/API calls. Search is literal, filters include effective status, and stable pagination is 20 records. Submitted fields and consent metadata are read-only. Approve/Reject use accessible confirmation dialogs and required internal reason; final/expired controls are disabled, with independent server enforcement.

No existing identity-match implementation was found to reuse. **A03 does not create Members, public profiles, credentials or sessions, or send membership email.** A04 owns identity linking/member records; A05 owns applicant/admin/status messages. New Lead assignment remains disabled until A06 supplies real groups. Local legacy Lead test fixtures are isolated authorization data, not application groups.

## Expiry operations and exact remaining setup

Effective expiry does **not** depend on someone opening the dashboard: query projections and decision predicates enforce the deadline. New submissions expire overdue records for their email; private reads/decisions safely persist relevant expiry. The standalone worker can persist it without any dashboard session:

- **Trusted operator CLI:** with the existing server DB/auth/origin environment loaded, run `npm run membership:expire`. It prints only `{ "expired": count, "moreDue": boolean }` and exits nonzero on failure. No applicant data or secrets. One transaction updates at most 500 and audits each once. Repeat while `moreDue` is true.
- **HTTP runner:** owner sets an independent random **`CRON_SECRET`**, 32–256 non-whitespace characters, server-only, then invokes `GET /api/internal/membership-expiry` with the exact `Authorization: Bearer …` header from its protected secret store. No administrator cookie is sufficient. Missing configuration returns 503; absent/wrong bearer returns 401; database failure returns generic 503, never a false completed sweep. Responses are private/no-store.

**No scheduler is currently configured or verified.** There is no hosted scheduler/CI definition in this checkout and this task changes no deployment setting. Physical unattended expiry persistence therefore remains an owner operational dependency; it is not claimed continuously running. Records beyond a sweep batch still read as expired and cannot be decided.

For a no-cost operator-controlled cron host that already has Node 24 and secure DB access, the owner can later use an absolute-path command such as:

```cron
*/15 * * * * cd /srv/nosee-new && /usr/bin/node --conditions=react-server --env-file=/secure/nosee-preview.env scripts/membership-expire.mjs
```

Replace paths with the actual trusted checkout/Node installation. The env file must be owner-readable only (0600), outside Git, and target the approved isolated Preview DB; never print it. Capture only the count/result, alert on nonzero exit, and drain `moreDue` batches by repeating the command. This example is setup guidance, **not an installed cron job**. If the owner instead chooses Vercel Cron later, add its approved schedule for `/api/internal/membership-expiry`, store `CRON_SECRET` in the intended environment, review the current plan/cadence limits, and verify an authenticated invocation. No Vercel plan, schedule or successful execution is assumed here. Expiry retains applications; lawful retention/deletion requires a separate approved policy.

Hosted review needs owner-authorized isolated Preview PostgreSQL, explicit migration `0002`, unchanged environment-specific auth secret, correct exact `ADMIN_ORIGIN`, securely provisioned existing review roles and the actual protected preview URL. **Never run the destructive local test suites against Neon/Preview/production.** Existing operator instructions remain in [architecture](architecture.md). Resend is irrelevant to A03 operation; its domain/configuration/live invitation acceptance remain pending separately.
