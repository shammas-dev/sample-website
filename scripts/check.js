/* Config checker. Run: npm run check   (the build runs it first and stops on errors).
   Errors = would break the site or ship wrong data. Warnings = review before going live. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadConfig(root) {
  const file = path.join(root, "js", "config.js");
  return vm.runInNewContext(fs.readFileSync(file, "utf8") + "\n;RESORT_CONFIG", {});
}

function check(cfg, root) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const demo = cfg.isDemo !== false;
  const isNum = (n) => typeof n === "number" && isFinite(n);

  // identity
  ["brandName", "shortName", "logoInitial", "address", "phoneDisplay", "email", "mapUrl", "checkInTime", "checkOutTime"].forEach((k) => {
    if (!cfg[k]) err(`config.${k} is empty`);
  });
  if (!/^[1-9]\d{9,14}$/.test(String(cfg.whatsappNumber || ""))) err(`whatsappNumber must be digits only incl. country code, e.g. 919876543210 (got "${cfg.whatsappNumber}")`);
  if (cfg.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cfg.email)) err(`email "${cfg.email}" looks invalid`);
  if (!cfg.mapEmbedUrl) warn("mapEmbedUrl is empty: the contact page map will be blank");

  if (cfg.siteUrl) {
    if (!/^https?:\/\/[^\/\s]+$/.test(cfg.siteUrl)) err('siteUrl must look like "https://www.example.com" (no trailing slash, no path)');
  } else if (demo) warn("siteUrl is empty (fine for the demo). Real clients need it for share previews, canonical links and the sitemap");
  else err("siteUrl is empty. Set it to the live address, e.g. https://www.example.com");

  // theme
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  Object.entries(cfg.theme || {}).forEach(([k, v]) => { if (!hex.test(v)) err(`theme.${k} "${v}" is not a hex colour like #163024`); });

  // navigation + page text
  const navPages = new Set();
  (cfg.nav || []).forEach((n) => {
    const file = String(n.href || "").split(/[#?]/)[0];
    if (file && !fs.existsSync(path.join(root, file))) err(`nav link "${n.label}" points to ${file}, which does not exist`);
    if (navPages.has(n.page)) err(`nav has two items with page "${n.page}"`);
    navPages.add(n.page);
    if (!(cfg.pages || {})[n.page]) warn(`pages.${n.page} (title/description) is missing`);
  });

  // rooms
  const rooms = cfg.rooms || [];
  if (!rooms.length) err("rooms is empty");
  const roomIds = new Set();
  rooms.forEach((r, i) => {
    const label = `rooms[${i}] ${r.name || ""}`.trim();
    if (!/^[a-z0-9-]+$/.test(r.id || "")) err(`${label}: id must be lowercase letters, numbers and dashes (got "${r.id}")`);
    if (roomIds.has(r.id)) err(`${label}: duplicate id "${r.id}"`);
    roomIds.add(r.id);
    if (!r.name) err(`${label}: name is missing`);
    if (!isNum(r.price) || r.price <= 0) err(`${label}: price must be a number above 0`);
    if (!r.image) err(`${label}: image is missing`);
    if (!r.shortDesc) warn(`${label}: shortDesc is empty`);
    if (r.maxAdults != null && !isNum(r.maxAdults)) err(`${label}: maxAdults must be a number`);
    if (r.maxChildren != null && !isNum(r.maxChildren)) err(`${label}: maxChildren must be a number`);
    if (r.maxAdults == null && !r.guests) warn(`${label}: no maxAdults/maxChildren, so no capacity warning and no guest text`);
  });

  // packages
  const pkgIds = new Set();
  (cfg.packages || []).forEach((p, i) => {
    if (!/^[a-z0-9-]+$/.test(p.id || "")) err(`packages[${i}]: id must be lowercase letters, numbers and dashes`);
    if (pkgIds.has(p.id)) err(`packages[${i}]: duplicate id "${p.id}"`);
    pkgIds.add(p.id);
    if (!p.name || !p.priceLabel) err(`packages[${i}]: name and priceLabel are required`);
  });

  // gallery
  const g = cfg.gallery;
  if (g) {
    const cats = new Set((g.categories || []).map((c) => c.id));
    if (!cats.has("all")) warn('gallery.categories should start with { id: "all", label: "All Photos" }');
    (g.items || []).forEach((it, i) => {
      if (!it.src) err(`gallery.items[${i}]: src is missing`);
      if (!cats.has(it.category)) err(`gallery.items[${i}]: category "${it.category}" is not in gallery.categories`);
    });
  }

  // pricing
  const p = cfg.pricing || {};
  if (p.weekendPercent != null && (!isNum(p.weekendPercent) || p.weekendPercent < 0)) err("pricing.weekendPercent must be a number (0 = off)");
  (p.weekendDays || []).forEach((d) => { if (!Number.isInteger(d) || d < 0 || d > 6) err(`pricing.weekendDays has "${d}". Use numbers 0-6 (0=Sun ... 6=Sat)`); });
  const md = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  (p.seasons || []).forEach((s, i) => {
    if (!md.test(s.from || "") || !md.test(s.to || "")) err(`pricing.seasons[${i}]: from/to must be MM-DD, e.g. "12-20" (got "${s.from}" / "${s.to}")`);
    if (!isNum(s.percent) || s.percent <= 0) err(`pricing.seasons[${i}]: percent must be a number above 0`);
    if (!s.name) err(`pricing.seasons[${i}]: name is missing`);
  });
  if (p.gstPercent != null && (!isNum(p.gstPercent) || p.gstPercent < 0 || p.gstPercent > 28)) err("pricing.gstPercent must be between 0 and 28");

  // images: stock photos, missing local files, heavy files
  const refs = [cfg.hero && cfg.hero.image, cfg.story && cfg.story.image, cfg.seo && cfg.seo.ogImage]
    .concat(((cfg.experiences || {}).items || []).map((i) => i.image))
    .concat(rooms.map((r) => r.image))
    .concat(((g || {}).items || []).map((i) => i.src))
    .filter(Boolean);
  let stock = 0;
  refs.forEach((ref) => {
    if (/^https?:\/\//.test(ref)) {
      if (/unsplash\.com/.test(ref)) stock++;
      return;
    }
    const file = path.join(root, ref);
    if (!fs.existsSync(file)) return err(`image "${ref}" not found (put client photos in the images/ folder)`);
    const kb = Math.round(fs.statSync(file).size / 1024);
    if (kb > 500) warn(`image "${ref}" is ${kb} KB. Compress to WebP under ~300 KB for fast mobile loading`);
  });
  if (stock) (demo ? warn : err)(`${stock} image(s) still use demo Unsplash stock photos. Replace them with the client's own photos`);

  // honesty checks
  if (demo) warn("isDemo is true: this is demo content. Set isDemo: false for a real client to enable the strict checks");
  else {
    if (cfg.rating && cfg.rating.show) warn("rating.show is true: confirm these figures are real and current (or set show: false)");
    if (cfg.headerBadge) warn(`headerBadge "${cfg.headerBadge}" is shown in the header: make sure it is true`);
    if (cfg.policies && cfg.policies.enabled) warn("policies page is enabled: review every line with the owner");
  }
  return { errors, warnings };
}

module.exports = { check, loadConfig };

if (require.main === module) {
  const root = path.resolve(__dirname, "..");
  const { errors, warnings } = check(loadConfig(root), root);
  warnings.forEach((w) => console.log("  warn  " + w));
  errors.forEach((e) => console.log("  ERROR " + e));
  console.log(`\nconfig check: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}
