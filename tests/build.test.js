const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { build, prerender, pageUrl } = require("../scripts/build.js");
const { check, loadConfig } = require("../scripts/check.js");

const ROOT = path.resolve(__dirname, "..");
const cfg = loadConfig(ROOT);
const clone = (o) => JSON.parse(JSON.stringify(o));
let n = 0;
const test = (name, fn) => { fn(); n++; console.log("  ok  " + name); };
const quiet = () => {};

// a throw-away copy of the project (so tests can change config.js)
function tempProject(edit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "resort-"));
  fs.cpSync(ROOT, dir, { recursive: true, filter: (p) => !/node_modules|[\\/]dist$|\.git[\\/]/.test(p) });
  if (edit) {
    const f = path.join(dir, "js", "config.js");
    fs.writeFileSync(f, edit(fs.readFileSync(f, "utf8")));
  }
  return dir;
}

const dir = tempProject((c) => c.replace('siteUrl: ""', 'siteUrl: "https://www.vanamist.in"'));
const out = path.join(dir, "dist");
build({ root: dir, out, skipCss: true, log: quiet });
const read = (f) => fs.readFileSync(path.join(out, f), "utf8");

test("all pages are written; policies and 404 included", () => {
  ["index", "rooms", "gallery", "contact", "policies", "404"].forEach((p) => assert.ok(fs.existsSync(path.join(out, p + ".html")), p));
  ["favicon.svg", "robots.txt", "sitemap.xml", "_headers"].forEach((f) => assert.ok(fs.existsSync(path.join(out, f)), f));
  assert.ok(!fs.existsSync(path.join(out, "js", "tailwind-theme.js")));
});

test("content is in the HTML itself (no JavaScript needed)", () => {
  const home = read("index.html");
  cfg.rooms.forEach((r) => assert.ok(home.includes(r.name), r.name));
  assert.ok(home.includes(cfg.hero.headline) && home.includes(cfg.brandName));
  assert.ok(read("gallery.html").includes(cfg.gallery.items[0].caption));
  assert.ok(read("contact.html").includes(cfg.packages[0].name) && read("contact.html").includes(cfg.contact.nearestAirport));
  assert.ok(!/id="site-header"|id="site-footer"/.test(home));
  assert.ok(home.includes('src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&amp;fit=crop&amp;w=2000&amp;q=80"'));
});

test("title, description and share-preview tags come from config", () => {
  const rooms = read("rooms.html");
  assert.ok(rooms.includes(`<title>${cfg.pages.rooms.title.replace(/&/g, "&amp;")}</title>`));
  assert.ok(rooms.includes('property="og:title"') && rooms.includes('property="og:image"'));
  assert.ok(rooms.includes('rel="canonical" href="https://www.vanamist.in/rooms"'));
  assert.ok(read("index.html").includes('rel="canonical" href="https://www.vanamist.in/"'));
});

test("JSON-LD is valid JSON; 404 is noindex with no structured data", () => {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(read("index.html"));
  assert.equal(JSON.parse(m[1])["@type"], "LodgingBusiness");
  assert.ok(read("404.html").includes('content="noindex"') && !read("404.html").includes("ld+json"));
});

test("sitemap lists real pages only; robots points to it", () => {
  const s = read("sitemap.xml");
  assert.ok(s.includes("<loc>https://www.vanamist.in/</loc>") && s.includes("/policies</loc>") && !s.includes("404"));
  assert.ok(read("robots.txt").includes("Sitemap: https://www.vanamist.in/sitemap.xml"));
});

test("cleanUrls:false keeps .html in canonical links", () => {
  assert.equal(pageUrl({ siteUrl: "https://a.in", seo: { cleanUrls: false } }, "rooms"), "https://a.in/rooms.html");
});

test("production mode swaps the Tailwind CDN for the compiled stylesheet", () => {
  const src = fs.readFileSync(path.join(ROOT, "rooms.html"), "utf8");
  const html = prerender(src, cfg, "rooms", { skipCss: false });
  assert.ok(html.includes('href="css/tailwind.css"') && !html.includes("cdn.tailwindcss.com") && !html.includes("tailwind-theme.js"));
  assert.throws(() => prerender("<html><head></head><body></body></html>", cfg, "rooms", { skipCss: false }), /Tailwind CDN block not found/);
});

test("without siteUrl: no canonical / sitemap, but the build still works", () => {
  const d2 = tempProject();
  build({ root: d2, out: path.join(d2, "dist"), skipCss: true, log: quiet });
  assert.ok(!fs.existsSync(path.join(d2, "dist", "sitemap.xml")));
  assert.ok(!fs.readFileSync(path.join(d2, "dist", "index.html"), "utf8").includes('rel="canonical"'));
});

// ---------- config checker ----------
const errorsFor = (mutate) => { const c = clone(cfg); mutate(c); return check(c, ROOT).errors.join(" | "); };

test("check: the demo config passes", () => assert.equal(check(cfg, ROOT).errors.length, 0));
test("check: bad WhatsApp number", () => assert.match(errorsFor((c) => (c.whatsappNumber = "+91 98765")), /whatsappNumber/));
test("check: duplicate room id and bad price", () => {
  assert.match(errorsFor((c) => (c.rooms[1].id = c.rooms[0].id)), /duplicate id/);
  assert.match(errorsFor((c) => (c.rooms[0].price = "4999")), /price must be a number/);
});
test("check: bad season date, bad weekend day, bad gallery category", () => {
  assert.match(errorsFor((c) => (c.pricing.seasons[0].from = "20-12")), /MM-DD/);
  assert.match(errorsFor((c) => (c.pricing.weekendDays = [7])), /weekendDays/);
  assert.match(errorsFor((c) => (c.gallery.items[0].category = "spa")), /not in gallery.categories/);
});
test("check: nav link to a missing page, bad colour", () => {
  assert.match(errorsFor((c) => (c.nav[1].href = "nope.html")), /does not exist/);
  assert.match(errorsFor((c) => (c.theme.gold = "gold")), /hex colour/);
});
test("check: real client (isDemo:false) must not ship stock photos or miss siteUrl", () => {
  const e = errorsFor((c) => (c.isDemo = false));
  assert.match(e, /Unsplash/);
  assert.match(e, /siteUrl is empty/);
});
test("check: missing local image is an error", () => assert.match(errorsFor((c) => (c.rooms[0].image = "images/missing.webp")), /not found/));
test("build refuses to run on a broken config", () => {
  const d3 = tempProject((c) => c.replace('whatsappNumber: "918606411892"', 'whatsappNumber: "123"'));
  assert.throws(() => build({ root: d3, out: path.join(d3, "dist"), skipCss: true, log: quiet }), /config check failed/);
});

console.log(`\n${n} tests passed`);
