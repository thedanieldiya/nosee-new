# Task 02 foundation evidence — 2026-10-13

These captures show the temporary **Next.js foundation specimen**, not the original Laravel site. They do not demonstrate public-page visual parity.

## Capture conditions

Local production server after `npm run build`, Chromium 154.0.8037.57, device scale factor 1, fresh browser context for each viewport, no network or CPU throttling. Existing Playwright/Chromium tooling was used without adding dependencies. Font readiness was awaited before capture; focus checks awaited the source color transition. Full-page captures and keyboard-focus viewport captures are retained below.

| Viewport | Specimen | Keyboard focus | Verified horizontal gutter |
| --- | --- | --- | --- |
| 390 × 844 | [Full page](foundation-390.png) | [Focus](focus-390.png) | 16px |
| 768 × 1024 | [Full page](foundation-768.png) | [Focus](focus-768.png) | 24px |
| 1440 × 1000 | [Full page](foundation-1440.png) | [Focus](focus-1440.png) | 64px |

[Browser observations](browser-checks.json) record actual computed styles and requests. All three widths passed checks for no horizontal overflow; Ubuntu Sans headings and IBM Plex Sans body; source color tokens; 36/44/48px link heights and 2px radius; all nine intent/variant combinations; disabled links without href, with `aria-disabled` and `tabIndex=-1`; decorative 16px masked arrow; valid in-page targets; page-specific `noindex, nofollow`; and the skip link and 2px accent focus outline. A separate JavaScript-disabled context verified readable content and native anchor navigation.

## Local payload observations

Each viewport made 13 observed requests including HTML, all same-origin and HTTP 200. Browser Resource Timing `encodedBodySize` totals for subresources were identical:

| Resource | Encoded body bytes | Approximate KiB |
| --- | --- | --- |
| JavaScript | 134,971 | 131.8 |
| CSS | 4,205 | 4.1 |
| Five Latin WOFF2 font faces | 105,240 | 102.8 |
| Source arrow SVG | 217 | 0.2 |

These are local production response-body observations, not total wire bytes, Vercel results, Lighthouse scores, or Core Web Vitals. There are no custom client components, but Next.js supplies its framework runtime. The specimen exercises all five imported font faces and exceeds the provisional JavaScript/font proposals in [the visual baseline](../../visual-baseline.md#7-measurable-acceptance-checklist-for-later-tasks). Review actual page font needs and public framework transfer during P2; no performance target is claimed met.

The legacy checkout remained unchanged. Original-site reference screenshots, Vercel deployment verification, and owner visual approval remain outstanding; see [PROGRESS.md](../../PROGRESS.md).
