# A01 — Secure foundation review

**15 October 2026 · [Published branch](https://github.com/thedanieldiya/nosee-new/tree/codex/admin-01-foundation) · Implementation `ef2a1e6` remote verified · Code In review · Owner review: Preview blocked.** Base main `8d90ebfad7536038dcf561023daacb947cf39330` includes merged Task 12. No PR/merge, production settings or A02 implementation.

## Delivered and external blocker

Real PostgreSQL administrator identities, Better Auth password/session handling, one-time masked CLI bootstrap, server role/group guards, scoped shadcn/MingCute shell, real own-account activity, persistent first/last-name editing and password change. Future modules are disabled; no Membership/Research/Publishing/Website editors, fake metrics, public signup or demo-password fallback.

**Hosted preview: unverified / blocked.** No hosted database or secret bindings are present, no hosted role accounts have been provisioned, and Vercel/GitHub deployment access is forbidden from this environment. Local tests use three genuinely authenticated, isolated **test-only** database identities, never production identities. Their random credentials are held outside Git and never printed. Screenshots supplement review; they do not satisfy owner-interactive hosted acceptance. [Exact infrastructure/bootstrap setup](../architecture.md#owner-required-infrastructure).

## Executed checks

| Check | Result |
| --- | --- |
| Existing public/unit suite + new policy/validation cases | **116/116 pass**, no skips; original 111 retained. The public-only server-icon assertion is now scoped to public files; the all-source ban on custom/second-pack icons remains. |
| PostgreSQL integration | **15 cases**: actual masked pseudo-terminal bootstrap, repeat/downgrade/concurrent refusal, hashed credentials, signup denial, anonymous and wrong-password denial, CSRF, bounded input, session/cookie privacy, role/scope tampering, persisted own-profile allowlist, immediate role/deactivation changes, password/revocation, expiry/logout and atomic parallel throttling. HTTPS Secure/host-only cookie configuration also tested through the real DB-backed library handler, not a hosted TLS deployment. |
| Typecheck / lint / production build / whitespace | Pass; final command results recorded in [PROGRESS](../../PROGRESS.md). No database/user provisioning at build time. |
| Responsive browser walkthrough | All three roles at **390/768/1440px**: sign in, correct navigation, mobile disclosure/focus return, keyboard name save, refresh persistence, account menu and sign out. Additional client password-confirmation/save and offline-no-false-save checks pass. |
| Accessibility / icons | **67 axe 4.14 AA-tag scans**, zero reported violations; **514** computed SVG/text observations across rest/hover/keyboard focus/active/selected/disabled states, zero mismatches. Keyboard dialog Escape/trap/return, 320px reflow, reduced motion, forced colours and dark scheme checked. Not manual AT or WCAG certification. |
| Missing/broken infrastructure | Separate production processes with missing config and unreachable PostgreSQL: sign-in unavailable, private pages redirect, auth writes return 503; public homepage stays 200. |
| Public regression | **36 captures / 18 full-page before/after pairs**, six existing routes × 390/768/1440, zero changed RGB pixels; **25** existing production route/redirect/404 checks pass. Existing event/date rules unchanged. |
| Public bundle isolation | Five public route client manifests contain **zero admin components, Radix or Better Auth**; fetched public scripts contain no admin API/UI/auth-library code. One extra small Next authorization-interrupt framework script: sampled decoded JS 465,939→467,163B (+1,224B), seven→eight JS requests. This is not compressed wire/CWV evidence; no new Lighthouse or optimisation. |
| Dependency audit | **Zero runtime advisories**. Full audit still has five inherited high lint-chain alerts through one unpatched braces advisory; [details/limits](../architecture.md#operations-and-remaining-gates), not a clean full-audit claim. |

Real browser font/image loading and reduced motion were used for settled public comparisons on the same local machine. Browser/SQL dumps, full matrices, logs, credentials and all other generated QA remain outside Git. Only six representative PNGs below (about 270KB) are retained. Initial QA caught early-streamed HTTP 200 denials, private Tailwind source exclusions, account-label spacing and modal-menu focus issues; each was corrected and the affected checks rerun successfully.

## Representative screenshots

All identities shown are local isolated test fixtures; emails are masked and no credentials/session tokens appear.

| State | Screenshot |
| --- | --- |
| Mobile sign-in | [390px](01-sign-in-mobile.png) |
| Super Admin Overview | [1440px](01-super-overview-desktop.png) |
| Super Admin personal General | [1440px](01-super-general-desktop.png) |
| Editor General and actual saved name | [768px](01-editor-general-tablet.png) |
| Lead scoped Overview | [390px](01-lead-overview-mobile.png) |
| Lead mobile navigation | [390px](01-lead-navigation-mobile.png) |

## Owner walkthrough — after secure preview provisioning

1. Open the **actual branch preview URL**, then `/admin/sign-in`; use the preview-only Super Admin credential established by the masked bootstrap through the approved secure mechanism.
2. Open Overview, use the sidebar/mobile menu and account menu; only genuine own-account activity is shown. Modules marked Soon have no editors yet.
3. In Settings → General, edit first/last name, save and refresh; confirm persistence. Test password change/sign-out. Email changes and photo uploads are explicitly unavailable.
4. Sign in as the separately provisioned preview-only Editor: only Overview, Publishing, Website and General appear; Membership/administrator/research URLs are denied server-side.
5. Sign in as the scoped preview-only Lead: only Overview, assigned Research and General appear. Other-group/create URLs are denied; the assigned future Research editor remains unavailable, with no fake form.
6. Repeat on mobile with keyboard/focus, then record independent owner approval or requested changes in [the tracker](../TRACKER.md).

**Pending:** actual hosted preview URL, isolated preview DB/env/account provisioning and secure account-access delivery, owner interactive/visual acceptance, manual assistive technology and production/security operations. [Local fallback and prerequisites](../architecture.md#local-integration-and-safe-review-fixtures) are documented; they do not waive hosted review. Stop at A01.
