# Resort Website Template

Static resort website with WhatsApp booking. No framework, no server, free hosting.
**Everything client-specific lives in `js/config.js`.**

## Two ways to run it
| | Development | Production |
|---|---|---|
| How | open the `.html` files (or any live-server) | `npm run build` creates the `dist/` folder |
| Styles | Tailwind CDN (quick, not for live sites) | compiled `css/tailwind.css` (small, fast) |
| Content | rendered in the browser from config.js | pre-rendered into the HTML (Google, WhatsApp previews and slow phones all see it) |

## Commands
```
npm install        once
npm run check      validates js/config.js (phone number, ids, season dates, images...)
npm run build      check + pre-render + SEO tags + sitemap + Tailwind  ->  dist/
npm test           unit tests (pricing, templates, build, config checker)
```

## Deploy on Cloudflare Pages
Framework preset: **None** · Build command: `npm run build` · Build output directory: `dist`
Every push to a branch gets its own preview URL. If the build fails, the log shows the exact config error.

## Structure
```
index.html rooms.html gallery.html contact.html policies.html 404.html   page shells (rarely edited)
js/config.js          <- edit this per client
js/templates.js       header, footer, rooms, packages, gallery... as pure functions (used by browser AND build)
js/components.js      puts templates on the page, menu behaviour
js/pricing.js         price + capacity rules
js/script.js          booking dock, WhatsApp messages, gallery lightbox
js/theme.js           applies config colours before first paint
js/tailwind-theme.js  Tailwind colours/fonts (single source for dev + build)
scripts/              check.js (config validator), build.js (production build)
tests/                npm test
images/               the client's own photos
css/style.css         small custom CSS
```

## New client checklist
1. Create the client's repo from this template; do not mix client data into the template repo.
2. Edit `js/config.js`: name, WhatsApp number (digits only), address, map links, colours, rooms, packages, gallery, policies.
3. Put the client's photos in `images/` (WebP, ~200-300 KB each) and point config to them (`"images/room-1.webp"`).
4. Set `isDemo: false` and `siteUrl: "https://their-domain"`. Remove or replace every item marked DEMO (ratings, badges, policies, claims).
5. `npm run check`. Fix every ERROR, read every warning.
6. Deploy, then test every page and every WhatsApp button on a real phone.

## Pricing (js/config.js > pricing)
| Setting | Meaning |
|---|---|
| `showLivePrice` | `true` = show estimate, `false` = "Custom Quote" (owner replies with the price) |
| `baseAdultsPerRoom`, `extraAdultPrice`, `extraChildPrice` | included adults per room, and per-night extra charges |
| `weekendPercent`, `weekendDays` | % added on weekend nights (`[5, 6]` = Fri & Sat nights). `0` = off |
| `seasons` | `{ name, from: "MM-DD", to: "MM-DD", percent }`, repeats every year. `[]` = none |
| `gstPercent`, `taxNote` | `0` + note = "Taxes extra."; or a % to add GST to the estimate |
| `roundTo` | round nightly rates (default ₹10) |

Weekend and season never stack: the higher % wins. Room capacity (`maxAdults`, `maxChildren`) only shows a warning.
Plain flat prices: set `weekendPercent: 0` and `seasons: []`.

## Colours
`theme.gold` is the decorative accent. The site automatically derives a darker "bronze" from it for buttons and small text so white text stays readable (WCAG AA). Override with `theme.bronze` if the client wants a specific shade.
