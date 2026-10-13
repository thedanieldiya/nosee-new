# Task 03 public-shell evidence — 13 October 2026

This task ports the shared navigation/footer around the temporary foundation specimen. The actual homepage and admin remain unimplemented. Source labels, paths, ordering, copy, placeholders and asset bytes were retained; preserving placeholders does not verify their truth.

## Reference and capture conditions

Reference revision: `9872c4ed12aa48835eab71065c69b468424adb4a`. A Git archive was rendered by Laravel in a separate `/tmp` directory, using existing installed dependencies and the existing `/workspace/cloud-setup/build` assets. Environment, cache, compiled views and storage were isolated from the read-only legacy checkout. No legacy dependency installation, rebuild or test suite was run. The reference's `APP_NAME=NOSEE` matches the Blade logo-alt fallback and existing Next document title; the deployed Laravel environment's app name remains unknown. This is a pinned local reference, not a capture of the live site.

Destination: `npm run start` after the final production build. Chromium 154.0.8037.57, device scale factor 1, locale en-GB, timezone Africa/Lagos, light scheme, no network/CPU throttling. Existing Playwright/Chromium was reused without installation. Fonts/logo readiness was awaited. Captures use reduced motion to hold source homepage motion still; separate default-motion checks verified 300ms header transitions. Fixed headers were hidden **only while taking footer crops**, identically in both browsers, to avoid covering the footer. Source/target content underneath the translucent header differs because the destination intentionally retains the specimen.

## Source-to-target mapping

| Pinned Laravel source | Destination |
| --- | --- |
| `content/navigation.php`, `Navigation.php` active/current rules | `src/lib/content/navigation.ts`; five focused [unit tests](../../../tests/navigation.test.mjs) |
| `content/site.php`, `FooterContentService.php` | `src/lib/content/site.ts`, typed literal records, independently compared to PHP exports |
| Three `components/navigation/*.blade.php` templates | `src/components/site/layout/SiteNavigation.tsx`, server-rendered source markup/classes |
| `navigation-state.js`, `mobile-navigation.js` | `NavigationController.tsx`, small scroll/pathname/drawer controller with listener cleanup |
| `components/footer/site-footer.blade.php` | `SiteFooter.tsx`, server markup and shared native-button classes |
| Newsletter form/JS/controller | `NewsletterController.tsx`, task-approved existing error response; no delivery, persistence or success handler |
| `layouts/app.blade.php`, `app.css` | Public layout offset variables; preview-only page padding; original button reset and required font weights |
| White logo and five social masks | Same case-sensitive `public/` paths, byte-identical; [asset sizes and hashes](assets.json) |

## Checks actually executed

- `npm run typecheck`: passed. `npm run lint`: final run passed without warnings after removing one unused suppression. `node --test tests/navigation.test.mjs`: **5 passed, 0 failed**. First production build passed; the browser check exposed the source no-JS CSS-layer problem. A second build checked a minimal correction, which was removed under the owner's stricter no-corrections instruction; a third/final build restored the literal source fallback. The final server was restarted for its no-JS recheck. `git diff --check`: passed.
- [Browser observations](browser-checks.json): source/target expanded and compact header geometry, nav typography/order/URLs, footer geometry/order/text/links, mask dimensions and form/control dimensions matched at all five widths. Desktop has only the Data & Products hover/focus dropdown. Expanded/compact state switches at 24/25px scroll; mobile logo becomes inert when compact.
- At 390/768px, opening, focus entry, Tab/Shift+Tab wrap, mutually exclusive submenus, Escape, overlay, toggle/link closing, overflow restoration and desktop-breakpoint reset passed against both renderers. Simulated target `/about` and `/products` document paths verified auto-open/current/parent states **without adding pages**. Unit tests also cover nested paths, fragments, disabled records and false prefix matches.
- Target asset responses were HTTP 200, with no browser errors. Valid newsletter input displayed the original error text, made no subscription request and left the confirmation dialog closed. The temporary page retained `noindex, nofollow` and its meaningful heading.
- **No-JS accessibility gate failed in the reference and remains blocked in the destination:** all 18 primary/child/drawer-utility links are in the HTML, but the source CSS hides the drawer/submenus while also hiding the menu button. The exact source rules were retained under the owner's explicit no-corrections instruction; the final recheck confirms the same failure. This is not a no-JS usability pass. No screen-reader, full WCAG, Lighthouse, Core Web Vitals or field-performance claim is made.

| Viewport | Source/target expanded height | Compact height | Footer computed height |
| --- | --- | --- | --- |
| 390 × 844 | 219.359375px (72px top bar + logo band) | 72px | 1360.5625px |
| 768 × 1024 | 264px (72px top bar + logo band) | 72px | 1332.5625px |
| 1024 × 768 | 140px | 104px | 592.5625px |
| 1280 × 900 | 164px | 104px | 540.5625px |
| 1440 × 1000 | 164px | 104px | 540.5625px |

## Actual screenshots

| Width | Expanded header | Drawer / compact header | Footer |
| --- | --- | --- | --- |
| 390px | [Reference](reference-expanded-390.png) / [Target](target-expanded-390.png) | [Reference drawer](reference-drawer-390.png) / [Target drawer](target-drawer-390.png) | [Reference](reference-footer-390.png) / [Target](target-footer-390.png) |
| 768px | [Reference](reference-expanded-768.png) / [Target](target-expanded-768.png) | [Reference drawer](reference-drawer-768.png) / [Target drawer](target-drawer-768.png) | [Reference](reference-footer-768.png) / [Target](target-footer-768.png) |
| 1440px | [Reference](reference-expanded-1440.png) / [Target](target-expanded-1440.png) | [Reference compact](reference-compact-1440.png) / [Target compact](target-compact-1440.png) | [Reference](reference-footer-1440.png) / [Target](target-footer-1440.png) |

The two drawer crop pairs are byte-identical. [Footer PNG dimensions](capture-dimensions.json) differ by one pixel in height despite matching fractional computed geometry; absolute pixel parity is not certified. The original Task 01 full-page/state screenshot matrix, live deployment comparison and owner visual acceptance remain outstanding. These shell captures do not complete P0/P2 or homepage parity.

## Explicit exceptions and retained concerns

1. **Newsletter (task-authorized safety exception):** preserve the source at-rest form/copy and closed confirmation markup, including `newletter`; validated JavaScript-enabled submission shows “Unable to subscribe right now. Please try again.” It sends/stores no email and never opens the false-success dialog. With no JavaScript, the original POST URL remains unrouted until approved backend work.
2. **No-JS fallback (preserved source defect; correction requires approval):** source fallback rules are unlayered, so Tailwind's important hidden reset wins and hides the drawer/submenus. A one-line `@layer base { ... }` wrapper around the exact two rules was verified to expose all 18 links, but was removed before publishing because the owner's instruction prohibits correcting source inconsistencies without approval. The no-JS accessibility gate remains blocked. That wrapper is the bounded proposed fix; no new wording, control or JavaScript-enabled layout change is needed.
3. **Temporary specimen:** its wrapper alone uses the documented expanded-header padding to keep the review content visible. Real homepage overlay remains later work; the header is not resized or redesigned.
4. **Preserved source quirk:** the close-icon span retains its CSS `hidden` class even when JS sets `hidden=false`. The source and destination both show no cross glyph while open; the labeled 44px toggle still closes the drawer. Do not correct this without approval.
5. **Unimplemented/placeholder destinations:** `/about`, `/research` and its five children, `/data`, `/products`, `/events`, `/publications`, `/outreach`, `/news`, `/multimedia`, `/support`, `/login`, `/join`, `/people`, `/privacy` and `/terms` remain source URLs; their destination pages are not part of this task. `About NSEE`, `Join NSEE`, the source contact/address/copyright and social-provider homepages remain literal and unverified. No links were retargeted or disabled to hide missing routes.

## Payload limits

Observed target subresource `encodedBodySize` totals **after interaction checks**: JS 136,942 bytes, CSS 7,241 bytes, fonts 122,216 bytes, logo/SVGs 20,938 bytes. The mobile checks temporarily cross the desktop breakpoint, so these cumulative figures include the desktop heading font; they are not cold mobile-entry budgets. No custom client-rendered page, third-party resource or new runtime dependency was added. PERF-01 remains unachieved.

Vercel preview URL/status: **unavailable from this environment**. Read-only GitHub status and Vercel requests returned HTTP 403. The existing Git integration is expected to deploy the task branch after push; [PROGRESS.md](../../PROGRESS.md) records publication evidence. No PR or merge is authorized.
