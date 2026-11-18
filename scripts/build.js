/* Production build:  npm run build   ->  dist/
   1. checks config.js (stops on errors)
   2. pre-renders every page into plain HTML (header, rooms, gallery... are in the file, no JavaScript needed to see them)
   3. adds SEO + share-preview tags, favicon, sitemap.xml, robots.txt
   4. compiles Tailwind CSS (replaces the development CDN)
   Options:  --skip-css (no Tailwind, used by tests)   --out <folder> (default: dist) */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const T = require("../js/templates.js");
const { check, loadConfig } = require("./check.js");

const PAGE_FILES = { home: "index", rooms: "rooms", gallery: "gallery", contact: "contact", policies: "policies", notfound: "404" };

// ---------- HTML transforms (pure string functions, unit-tested) ----------
function renderMounts(html, cfg, page) {
  const ctxBase = { page, hasStickyBar: /data-sticky-bar/.test(html), year: new Date().getFullYear() };
  T.MOUNTS.forEach((m) => {
    const re = new RegExp(`<(\\w+)((?:\\s[^>]*?)?)\\sid="${m.id}"([^>]*)>\\s*</\\1>`);
    html = html.replace(re, (all, tag, before, after) => {
      const variant = (/data-variant="([^"]*)"/.exec(before + after) || [])[1] || "solid";
      const out = m.render(cfg, { ...ctxBase, variant });
      return m.mode === "replace" ? out : `<${tag}${before} id="${m.id}"${after} data-rendered="1">${out}</${tag}>`;
    });
  });
  return html;
}

function setAttr(tag, name, value) {
  const re = new RegExp(`(\\s${name}=")[^"]*"`);
  return re.test(tag) ? tag.replace(re, (m, a) => `${a}${T.esc(value)}"`) : tag.replace(/^<(\w+)/, (m, t) => `<${t} ${name}="${T.esc(value)}"`);
}

function applyBindings(html, cfg) {
  // <tag data-cfg="path"></tag>  ->  text
  html = html.replace(/<(\w+)([^>]*?)\sdata-cfg="([^"]+)"([^>]*)>\s*<\/\1>/g, (all, tag, a, p, b) => {
    const v = T.get(cfg, p);
    return v == null ? all : `<${tag}${a} data-cfg="${p}"${b}>${T.esc(v)}</${tag}>`;
  });
  // <img|iframe data-cfg-src / data-cfg-alt>  ->  src / alt
  return html.replace(/<(img|iframe)\b[^>]*\sdata-cfg-(?:src|alt)="[^"]*"[^>]*>/g, (tag) => {
    const attr = (n) => (new RegExp(`\\sdata-${n}="([^"]*)"`).exec(tag) || [])[1];
    const src = attr("cfg-src") && T.get(cfg, attr("cfg-src"));
    const alt = attr("cfg-alt") && T.get(cfg, attr("cfg-alt"));
    if (src) tag = setAttr(tag, "src", attr("w") ? T.img(src, attr("w")) : src);
    if (alt) tag = setAttr(tag, "alt", alt);
    return tag;
  });
}

function pageUrl(cfg, page) {
  if (!cfg.siteUrl) return "";
  if (page === "home") return cfg.siteUrl + "/";
  const clean = !(cfg.seo && cfg.seo.cleanUrls === false);
  return `${cfg.siteUrl}/${PAGE_FILES[page]}${clean ? "" : ".html"}`;
}

function absolute(cfg, url) {
  if (!url) return "";
  return /^https?:\/\//.test(url) ? url : cfg.siteUrl ? `${cfg.siteUrl}/${url.replace(/^\//, "")}` : "";
}

function headExtras(cfg, page) {
  const e = T.esc;
  const meta = (cfg.pages || {})[page] || {};
  const vars = T.themeVars(cfg);
  const css = ":root{" + Object.keys(vars).map((k) => `${k}:${vars[k]}`).join(";") + "}";
  const out = [`<link rel="icon" href="favicon.svg" type="image/svg+xml" />`, `<meta name="theme-color" content="${e((cfg.theme || {}).forest || "#163024")}" />`, `<style id="theme-vars">${css}</style>`];
  if (page === "notfound") return out.join("\n    ");

  const url = pageUrl(cfg, page);
  const image = absolute(cfg, (cfg.seo && cfg.seo.ogImage) || "") || (cfg.hero && /^https?:\/\//.test(cfg.hero.image) ? T.img(cfg.hero.image, 1200) : absolute(cfg, cfg.hero && cfg.hero.image));
  if (url) out.push(`<link rel="canonical" href="${e(url)}" />`, `<meta property="og:url" content="${e(url)}" />`);
  out.push(
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${e(cfg.brandName)}" />`,
    `<meta property="og:title" content="${e(meta.title || cfg.brandName)}" />`,
    `<meta property="og:description" content="${e(meta.description || "")}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`
  );
  if (image) out.push(`<meta property="og:image" content="${e(image)}" />`);
  out.push(`<script type="application/ld+json">${JSON.stringify(T.jsonLd(cfg, cfg.siteUrl)).replace(/</g, "\\u003c")}</script>`);
  return out.join("\n    ");
}

function finalizeHead(html, cfg, page, { skipCss }) {
  const meta = (cfg.pages || {})[page];
  if (meta && meta.title) html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${T.esc(meta.title)}</title>`);
  if (meta && meta.description) html = html.replace(/(<meta name="description" content=")[^"]*"/, (m, a) => `${a}${T.esc(meta.description)}"`);

  if (!skipCss) {
    const re = /<!-- STYLES[\s\S]*?-->\s*<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>\s*<script src="js\/tailwind-theme\.js"><\/script>/;
    if (!re.test(html)) throw new Error(`${PAGE_FILES[page]}.html: Tailwind CDN block not found (expected the "STYLES" comment + 2 script lines in <head>)`);
    html = html.replace(re, '<link rel="stylesheet" href="css/tailwind.css" />');
    html = html.replace(/\s*<script src="js\/tailwind-theme\.js"><\/script>/g, "");
  }
  return html.replace("</head>", () => `    ${headExtras(cfg, page)}\n</head>`);
}

function prerender(html, cfg, page, opts = {}) {
  return finalizeHead(applyBindings(renderMounts(html, cfg, page), cfg), cfg, page, { skipCss: !!opts.skipCss });
}

// ---------- build ----------
function favicon(cfg) {
  const t = cfg.theme || {};
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${T.esc(t.forest || "#163024")}"/><text x="32" y="45" font-family="Georgia,serif" font-size="38" font-weight="700" text-anchor="middle" fill="${T.esc(t.gold || "#C88A55")}">${T.esc(cfg.logoInitial || "")}</text></svg>\n`;
}

function build({ root, out, skipCss = false, log = console.log }) {
  const cfg = loadConfig(root);
  const { errors, warnings } = check(cfg, root);
  warnings.forEach((w) => log("  warn  " + w));
  if (errors.length) {
    errors.forEach((e) => log("  ERROR " + e));
    throw new Error(`config check failed (${errors.length} error(s)). Fix js/config.js and run again.`);
  }

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "css"), { recursive: true });
  fs.mkdirSync(path.join(out, "js"), { recursive: true });

  fs.copyFileSync(path.join(root, "css", "style.css"), path.join(out, "css", "style.css"));
  // only the files the pages actually load (tailwind-theme.js is development-only)
  ["config", "templates", "theme", "components", "pricing", "script"].forEach((f) =>
    fs.copyFileSync(path.join(root, "js", f + ".js"), path.join(out, "js", f + ".js"))
  );
  if (fs.existsSync(path.join(root, "images"))) fs.cpSync(path.join(root, "images"), path.join(out, "images"), { recursive: true });

  const pages = Object.keys(PAGE_FILES).filter((p) => p !== "policies" || (cfg.policies && cfg.policies.enabled));
  pages.forEach((page) => {
    const src = fs.readFileSync(path.join(root, PAGE_FILES[page] + ".html"), "utf8");
    fs.writeFileSync(path.join(out, PAGE_FILES[page] + ".html"), prerender(src, cfg, page, { skipCss }));
  });

  fs.writeFileSync(path.join(out, "favicon.svg"), favicon(cfg));
  fs.writeFileSync(path.join(out, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n");

  if (cfg.siteUrl) {
    const day = new Date().toISOString().slice(0, 10);
    const urls = pages.filter((p) => p !== "notfound").map((p) => `  <url><loc>${T.esc(pageUrl(cfg, p))}</loc><lastmod>${day}</lastmod></url>`);
    fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  }
  fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\n${cfg.siteUrl ? `\nSitemap: ${cfg.siteUrl}/sitemap.xml\n` : ""}`);

  if (!skipCss) {
    const bin = path.join(root, "node_modules", ".bin", "tailwindcss");
    if (!fs.existsSync(bin)) throw new Error("Tailwind is not installed. Run `npm install` first.");
    execFileSync(bin, ["-c", "tailwind.config.js", "-i", "src/input.css", "-o", path.join(out, "css", "tailwind.css"), "--minify"], { cwd: root, stdio: "inherit" });
    if (!fs.existsSync(path.join(out, "css", "tailwind.css")) || fs.statSync(path.join(out, "css", "tailwind.css")).size < 1000) throw new Error("Tailwind produced no CSS");
  }

  log(`\nbuilt ${pages.length} pages -> ${path.relative(process.cwd(), out) || "."}${skipCss ? " (CSS skipped)" : ""}`);
  return { cfg, pages };
}

module.exports = { build, prerender, renderMounts, applyBindings, headExtras, pageUrl };

if (require.main === module) {
  const args = process.argv.slice(2);
  const o = args.indexOf("--out");
  try {
    build({ root: path.resolve(__dirname, ".."), out: path.resolve(o > -1 ? args[o + 1] : path.join(__dirname, "..", "dist")), skipCss: args.includes("--skip-css") });
  } catch (e) {
    console.error("\nBUILD FAILED: " + e.message);
    process.exit(1);
  }
}
