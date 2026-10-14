# Source-derived public visual baseline

**Pinned-source inspection:** 13 October 2026. **Updated:** 14 October 2026; retained design reference after completed public migration.
**Legacy source:** [`9872c4ed12aa48835eab71065c69b468424adb4a`](https://github.com/thedanieldiya/nosee/tree/9872c4ed12aa48835eab71065c69b468424adb4a).
**Related:** [migration map](migration-map.md), [PRD](PRD.md), [progress](PROGRESS.md).

This retains original CSS/template/browser-code contracts, not a current screenshot or performance report. The original public port is complete as a development milestone; [public-site status](PUBLIC-SITE-STATUS.md) records approved changes and outstanding release gates. Legacy asset sizes/loading and inactive motion below describe the pinned source; current responsive image variants, MingCute icons, contrast/focus and native no-JS fixes are authorised exceptions. Live/source/Figma verification is not inferred.

## 1. Exact theme and typography

Evidence: `resources/css/app.css`; local Fontsource CSS identified by `package.json` and the existing lockfile.

| Token | Source value | Visible use |
| --- | --- | --- |
| `brand` | `#13853d` | Primary buttons, mobile top band, links, quote block, meeting duration panel |
| `accent` | `#1e4ec4` | Focus outlines |
| `primary` | `#171717` | Primary copy; footer/news/hero base background |
| `secondary` | `#5c5c5c` | Supporting copy and dates |
| `tertiary` | `#a3a3a3` | Footer headings/text/social masks |
| `disabled` | `#d1d1d1` | Inactive profile dots and disabled treatment |
| `inverse`, `default` | `#ffffff`, `#ffffff` | Inverse text, normal page background |
| `surface` | `#f7f7f7` | Alternating homepage sections, secondary controls/panels |
| `line-soft`, `line-mild`, `line-strong` | `rgb(0 0 0 / 0.05)`, `/ 0.1`, `/ 0.2` | Dividers/borders, progressively stronger |

Additional source-specific colors must not be flattened into the palette: monitoring title `#0b5025`, featured event image fallback `#d9d9d9`, black/70 navigation with 10px backdrop blur, black/75 hero overlay, white/20 nav/footer borders, green/70 news date chips and black/85→25→10% news gradient. `config/event-types.php` uses meeting green; conference purple-100/800; workshop orange-100/800; lecture blue-100/800; training sky-100/800; outreach rose-100/800. Non-meeting duration panels use surface/primary. Destructive button variants use Tailwind red-600/700/800.

- Heading family: **Ubuntu Sans**; body: **IBM Plex Sans**, then system sans fallbacks. Imported Latin normal weights are 400/500/600/700 for each family, plus IBM Plex Sans 400 italic. Existing Fontsource CSS uses `font-display: swap`, WOFF2 with WOFF fallback. Both packages are pinned to **5.2.8**. Body and heading base rules assign these families; some research-card headings explicitly use body type.
- `--font-sans` declares Instrument Sans, but no Instrument font is imported. Do not fetch another brand font to implement that unused declaration.
- No custom breakpoints override Tailwind 4 defaults: `sm` 40rem/640px, `md` 48rem/768px, `lg` 64rem/1024px, `xl` 80rem/1280px, `2xl` 96rem/1536px (px conversions assume the normal 16px root). At **768px** the navigation and most About editorial layout still use the below-`lg` variant.

| Pattern | Source sizes / line heights and weight |
| --- | --- |
| Hero h1 | 28/32px, semibold; `lg` 56/64px |
| Hero eyebrow / summary | 12/16px uppercase; summary 16px → `lg` 20px |
| Home major section headings | Research/events 28/32px semibold → `lg` 48/56px; news switches at `md`; monitoring 20/24px medium → `lg` 28/40px |
| About title / intro headline | Title 22/30px medium → `xl` 24/32px; headline 36/42px semibold → `lg` 46/54px → `xl` 56/64px |
| About mission / quote | Mission heading 30/36 → 34/42 → 40/48px; statement 20/30 → 24/34 → 28/40px. Quote 28/36 → 34/44 → 40/50px, medium |
| Events index/archive h1 | 40/48px semibold → `lg` 48/56px; detail h1 40/48 → 56/64px |
| Cards / body | Event/card titles commonly 20/28 → 24/32px medium; body 14/20 or 16/24px; news leading featured 20/28 → `md` 40/48px |

## 2. Layout, spacing and responsive composition

Evidence: `components/ui/container.blade.php`, `layouts/app.blade.php` and page/section templates under `resources/views/`.

The shared container is `max-w-[90rem]` (1440px), centered with 16px gutters, `sm` 24px, `lg` 32px, `xl` 64px. At the requested widths, nominal inner widths are **358, 720, 1312px**. Common grids have 16/20px narrow gaps, 24px medium and 32px desktop gaps; do not homogenize About's explicit pixel spacings.

| Area | Below desktop / 390–768px | Desktop / 1440px |
| --- | --- | --- |
| Shared navigation | Fixed 72px green utility band. Expanded logo band uses black/70; compact mode removes it. Mobile drawer starts at 72px, fills remaining viewport height with vertical scroll | Fixed black/70 two-tier header; expanded 140px at `lg`, 164px at `xl`; compact 104px. Logo content height 5.8rem → `xl` 7.5rem, compact 4.5rem |
| Page top offset | Secondary pages use `clamp(12.3125rem, calc(5.8555rem + 32.2266vw), 16.5rem)`; compact offset 4.5rem | Expanded offset 8.75rem → `xl` 10.25rem; compact 6.5rem. Homepage omits this offset |
| Hero | Fixed **750px**, centered 968px-wide image crop, 75% black overlay; title panel centered vertically plus 80px margin, 16px horizontal insets; credit hidden | 850px high, full-width cover image; title panel left 120px, width 852px, +40px margin; credit right 120px/bottom 75px, max 294px |
| Monitoring | Surface section, 40px vertical padding; stack three cards with 16px gaps. Mobile action `ALL DATA` | 64px padding, equal horizontal cards/32px gaps; heading/action row with `SEE ALL DATA` |
| Research / upcoming events | White sections, 32px vertical padding; one column, 20px card gaps, action below | 64px padding, three columns/32px gaps; action at heading. Event cards minimum 420px → 480px at `lg` |
| Trending news | Surface, 40px padding → `md` 64px. Featured square and compact group stack until `xl`; compact group becomes two columns at `md`. Narrow action `VIEW ALL NEWS` | Two equal outer columns/32px gap: featured square plus 2×2 compact/action grid. Fourth tile `VIEW MORE`; image hover scale 1.1 |
| About editorial layout | Article bottom 96px; intro top 84px, headline gap 28px; image 260px → `sm` 360px. Mission follows at 118px, quote 110px later; quote 390px high and its image hidden below `lg` | Bottom 128px; intro top 80px, 12-column grid/32px gaps (`lg` first uses 8 columns/24px). Intro image 400px; mission/objectives often 120px spacing; quote 330px high, 416px image column |
| About story / leadership | Story follows quote by 184px; image 300px high. Seven square profiles, one visible below `sm`, two at `sm`; arrows hidden below `sm` | Story image 500px high in 7-of-12 columns; three profiles visible at `lg`, 32px track gaps; subsequent sections usually 120px spacing |
| Events listing | Top 40px; title/featured/ongoing/upcoming flow; search **hidden below `lg`**; archive action **hidden below `sm`** | Top 24px; 416×48px search. Day column 304px + 32px gap; ongoing indented 336px. Month heading sticky at compact nav offset |
| Event rows / archive | Stacked cards; title is link; secondary row CTA hidden below `lg`. Archive year/month/day blocks; empty states use centered text | Row columns 191px / flexible / 191px, min height 184px; featured 415px / flexible / 191px, image min height 308px |
| Event detail | Summary/header; info grid one column → `sm` two. Itinerary, resources, organiser/speakers; optional deadline/register action | Four info columns; body/people grid `minmax(0,2fr) minmax(18rem,1fr)` with 64px gap and dividing border |
| Footer | Primary dark background; order organisation → newsletter → contacts → quick links; 64px vertical padding, 48px gaps | Twelve columns: organisation 3, contacts 3, links 2, newsletter 4; top 96px/bottom 32px; legal row after 96px |

Other source anchors: About's intro copy switches at `lg` and `xl`; closing statement at `xl`; objectives use shorter mobile copy. Intro `<picture>` sources switch at **1024 and 1280**, not 768. Story and quote image crops, spacer values and the last objective's `lg` spanning layout are part of the baseline. Preserve the actual viewport-conditioned text, not merely its longest version.

Buttons (`components/ui/button.blade.php`) have 2px corners, heights **36/44/48px** for sm/base/lg, horizontal padding **12/16/20px**, 14/16/16px type; fill/stroke/text and primary/secondary/destructive variants. An `href` produces an anchor; disabled anchors lose href, receive `aria-disabled` and `tabindex=-1`. Icon-only controls require an accessible name. Standard focus outline is 2px accent with 2px offset; some links use 4px offset. Monitoring cards have 16:9 previews, research cards lose their outer border/padding on desktop, and news/profile cards are square; retain these distinctions.

## 3. Interactions and proposed client boundaries

| Source evidence | Existing behavior to preserve / explicitly decide |
| --- | --- |
| `navigation-state.js` | Expanded through scrollY 24; compact at 25+. One passive scroll listener synchronizes both nav variants and makes expanded-only elements inert |
| `desktop-primary-links.blade.php` | **Only Data & Products** exposes a desktop dropdown, on hover/focus-within. About/research child links appear as mobile submenus, not desktop dropdowns |
| `mobile-navigation.js` + mobile template | Menu/Escape/overlay/link close behavior, scroll lock/restoration, focus trap/return, active submenu auto-open, only one submenu open; crossing 1024 closes/reset drawer. `<noscript>` exposes links/submenus and hides nonworking controls |
| `hero-carousel.js` + hero template | Desktop ≥1024: six-second autoplay, paused for hover/focus/tab hidden; mobile horizontal swipe ≥50px and stronger than vertical displacement; indicator navigation wraps; 400ms transform/fade/blur lock; inactive content inert/aria-hidden. One slide has no controls/timer; reduced motion stops autoplay and transition locking |
| `profile-carousel.js` | 1/2/3 profiles at below 640 / 640–1023 / ≥1024. Arrows step one card and wrap; indicators step a group; dots become 7/4/3 for seven profiles. Swipe ≥50px only below 640. Offscreen slides inert/aria-hidden; no autoplay; viewport changes preserve the current profile index |
| `homepage-animations.js` | Homepage-only dynamic Motion import. Hero stages start at 0/.18/.32/.48/.64/.82 seconds; durations .65/.4/.6/.5/.45/.4; easing `[.22,1,.36,1]`. Section reveal: 20% in view with bottom -10% margin; heading .55s, cards .6s staggered .07s starting .15s, actions .45s starting .25s; once per section |
| `app.css`, news card | ≥1024 card hover/focus-within lifts 4px with shadow, 250ms; news hover zoom 300ms. Reduced motion disables lift/zoom/entrance/reveal animation and preserves rendered final content; profile track has no timed autoplay transition |
| `newsletter.js` + footer | Native validation, FormData/CSRF, Accept JSON, submitting guard/disabled control/aria-busy, generic failure alert; any HTTP-ok response opens native dialog. Dismiss/Escape/backdrop close; focus returns to email field. Backend currently only logs: success is not delivery proof |

Proposed React components are enumerated in [migration-map.md](migration-map.md#3-source--proposed-react-composition). Keep container/buttons/headings/cards server-rendered and isolate menu/carousel/newsletter behavior. Preserve no-JS reading/navigation. Keyboard, reduced-motion, empty/error/search and time-dependent event states need their own later observations; reading source does not establish WCAG conformance.

## 4. Asset and font baseline

Measured by reading image headers/file sizes from the pinned checkout; **bytes are on-disk originals, not compressed HTTP transfers**. Media paths are under `public/`; filename case matters.

| Asset | Actual pixels | Bytes |
| --- | --- | ---: |
| `logo.png`; `logoWhite.png` | 150×48; 512×165 | 8,227; 18,717 |
| `media/home/hero-1.png` | 1440×850 | 1,269,779 |
| `media/home/hero-2.jpg` | 3892×2457 | 1,496,169 |
| `media/about/earth-space-environment{,-tablet,-mobile}.png` | 864×400; 591×360; 370×260 | 458,044; 279,329; 149,280 |
| `media/about/solar-observation{,-tablet}.png` | 416×330; 296×320 | 106,358; 93,620 |
| `media/about/earth-from-space.png` | 468×430 | 394,947 |
| `media/monitoringDashboards/fRegionObservations.png` | 600×338 | 186,977 |
| `media/monitoringDashboards/rangeError.png` | 600×338 | 213,836 |
| `media/monitoringDashboards/tecDifference.png` | 600×338 | 203,079 |
| `media/trending/trending1.png` | 642×642 | 285,633 |
| `media/trending/trending2.png`; `trending3.png` | 310×309 each | 174,097; 87,943 |

The 16 raster originals total **5,426,035 bytes**, not one page's download size. No AVIF/WebP or hero mobile variants are present. Hero/template intrinsic 1440×850 does not match the second file's natural dimensions. About story declares 752×500 but its original is 468×430. Preserve observed cover crops; flag potential upscale/optimization decisions for review rather than silently changing imagery.

Eleven SVGs under `media/icons/`: `CalendarDots`, `Clock`, `MapPin`, `arrow-right`, `arrow-up-right`, `search`, and five social icons (facebook/instagram/linkedin/x/youtube). First hero is high priority; later hero/About/story/profile images are lazy where specified. Monitoring and news images lack lazy attributes in their templates. Source credits include NASA visualization and Unsplash photography; external monitoring records name `National Weather Services` and link to `https://www.spaceweather.gov/products/glotec`. Verify rights/approved attribution separately.

`public/build/manifest.json` references an existing unrebuilt CSS entry of **83,447 bytes**, shared JS **9,116 bytes**, and dynamic homepage motion JS **11,126 bytes**, plus nine font faces in WOFF2/WOFF. These are artifact/file-size observations only: build currency, actual font downloads, gzip/Brotli size, HTML bytes and total request count were **not measured**. No dependency/build command was run to refresh them.

## 5. Maintenance checks and source discrepancies

For future approved public UI changes, compare the actual pinned renderer and destination at identical viewport, DPR, fonts, content revision, clock/timezone, slide and motion state. Check complete pages plus affected sections, crops, breakpoints, keyboard/focus/hover, JS/no-JS navigation and reduced motion. Generated captures/logs belong in temporary or CI storage, not a new tracked artifact archive.

- Keep source NSEE/NOSEE spelling, viewport-dependent copy, John Doe/leadership placeholders and mockup text until content is explicitly approved.
- The source hero autoplays despite older PRD wording and uses a 750px mobile frame despite old `78svh` assertions; preserve the implemented behaviour. The six-stage hero entrance was explicitly authorised; other source reveals remain inactive.
- Do not recreate false newsletter delivery claims. Its source appearance remains, with the honest-error exception until a provider is integrated.
- Image/attribution rights, live deployment, manual accessibility and content/indexing remain separate release decisions. Current mobile Lighthouse ~3.54s is accepted provisionally; ≤2.5s and field CWV are deferred.
- Public general UI uses existing official MingCute glyphs and inherited adjacent-text `currentColor`; retain exact surrounding geometry. Admin/shadcn remains a separate phase and must not enter public bundles.
