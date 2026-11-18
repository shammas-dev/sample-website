# Changelog

## Phase 3: Production-ready
- `npm run build` pre-renders every page into static HTML in `dist/` (content visible without JavaScript, WhatsApp/Google link previews work) and compiles Tailwind (CDN removed from production).
- Rendering moved to pure functions in `js/templates.js`, shared by the browser (dev) and the build. `js/sections.js` is gone.
- SEO from config: per-page title/description, canonical, Open Graph + Twitter tags, JSON-LD (`LodgingBusiness`, no invented ratings), favicon from the logo initial, `sitemap.xml`, `robots.txt`, `404.html`.
- `npm run check` validates config (WhatsApp number, ids, prices, season dates, gallery categories, nav links, local images). `isDemo:false` enables strict rules (no stock photos, siteUrl required).
- New `policies.html` (booking, cancellation, house rules, privacy), config-driven, linked from the footer.
- Accessibility/UX: guest +/- buttons 40px on phones (stacked rows), skip link, 100svh hero, gallery captions visible on mobile, lightbox with Esc / arrow keys / swipe / prev-next / focus return, `aria-pressed` filters, darker "bronze" for buttons and small gold text (contrast 4.7:1), larger small-text sizes.
- Tests: templates, build output, config checker (`npm test`).

## Phase 2: Booking engine
- New `js/pricing.js` (pure logic, 12 unit tests: `npm test`). Booking dock now uses it.
- Simple seasonal pricing in `config.js > pricing`: `weekendPercent` + `seasons` (MM-DD ranges, repeat yearly, wrap over New Year). If weekend and season both apply, the higher % is used.
- Capacity warning (never blocks booking): rooms have `maxAdults` / `maxChildren`; "Max 2 Adults + 1 Child" text is generated from them.
- Total is clearly an estimate ("Estimate. Taxes extra. Final rate confirmed on WhatsApp."). `gstPercent` shows "Incl. X% GST".
- WhatsApp messages: per-night rate breakdown (Weekend / Season / Regular), capacity note for the owner, and a `Ref: WEB-DDMM-XXX` code.
- Fixed while building: capacity warning element was placed after the scripts (null at load).

## Phase 1: Foundation
- `config.js` is now the single source for brand, rooms, packages, gallery, story, experiences, nav, footer, page titles/descriptions and theme.
- Header, mobile menu, footer and floating buttons are rendered once (`js/components.js`) on every page.
- Fixed: no mobile navigation on rooms / gallery / contact pages.
- Fixed: `theme` colours in config.js had no effect (Tailwind used hard-coded hex). Colours are now CSS variables.
- Fixed: phone number mismatch on contact page, "6 stays" text with only 3 rooms, map embed hard-coded.
- Rating, trust bar, header badge and story stats are config-driven (set `rating.show:false` to hide invented figures).
- Rooms are selected by `id` (not by price); WhatsApp links for footer/floating buttons are real `<a>` links.
- Reveal animations no longer hide content if JS fails; reduced-motion respected; visible keyboard focus.
- Added Tailwind production build setup (`package.json`, `tailwind.config.js`, `src/input.css`). Still using the CDN until you run the build.
