/* Pure render functions: (config, context) -> HTML string. No DOM access.
   The SAME code runs in two places:
   - browser (js/components.js) when you open the source pages directly while developing
   - Node (scripts/build.js) to pre-render static HTML into dist/ for production / SEO / link previews */
const Templates = (() => {
  // ---------- helpers ----------
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const img = (url, w) => String(url || "").replace(/([?&]w=)\d+/, "$1" + w);
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const waUrl = (cfg, msg) => `https://wa.me/${digits(cfg.whatsappNumber)}?text=${encodeURIComponent(msg)}`;
  const get = (cfg, path) => String(path).split(".").reduce((o, k) => (o == null ? undefined : o[k]), cfg);
  const guestsText = (r) =>
    r.guests ||
    (r.maxAdults
      ? `Max ${r.maxAdults} Adult${r.maxAdults > 1 ? "s" : ""}` + (r.maxChildren ? ` + ${r.maxChildren} Child${r.maxChildren > 1 ? "ren" : ""}` : "")
      : "");

  // ---------- theme ----------
  const hexToRgb = (hex) => {
    let h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return /^[0-9a-fA-F]{6}$/.test(h) ? [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) : null;
  };
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const contrastOnWhite = (rgb) => 1.05 / (luminance(rgb) + 0.05);

  // "bronze" = the gold darkened just enough for white text / small text on light backgrounds (WCAG AA 4.5:1)
  function deriveBronze(gold) {
    let rgb = gold.slice();
    for (let f = 1; contrastOnWhite(rgb) < 4.6 && f > 0.3; f -= 0.02) rgb = gold.map((v) => Math.round(v * f));
    return rgb;
  }

  // -> { "--c-forest": "22 48 36", ... }  (RGB channels so Tailwind opacity classes work)
  function themeVars(cfg) {
    const theme = cfg.theme || {};
    const vars = {};
    Object.keys(theme).forEach((key) => {
      const rgb = hexToRgb(theme[key]);
      if (rgb) vars["--c-" + key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())] = rgb.join(" ");
    });
    const gold = hexToRgb(theme.gold);
    if (gold && !vars["--c-bronze"]) {
      const bronze = deriveBronze(gold);
      vars["--c-bronze"] = bronze.join(" ");
      vars["--c-bronze-hover"] = bronze.map((v) => Math.round(v * 0.88)).join(" ");
    }
    return vars;
  }

  // ---------- icons ----------
  const WA_ICON = `<svg class="w-6 h-6 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0012.07 0C5.49 0 .16 5.32.16 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.33-1.66a11.87 11.87 0 005.74 1.46h.01c6.58 0 11.92-5.33 11.92-11.9a11.83 11.83 0 00-3.48-8.42zM12.08 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.76.98 1-3.66-.24-.38a9.86 9.86 0 01-1.51-5.25c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.9 7c0 5.45-4.44 9.9-9.88 9.9zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>`;
  const PIN_ICON = `<svg class="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`;

  // ---------- shell: header / footer / floating buttons ----------
  function header(cfg, ctx) {
    const overlay = ctx.variant === "overlay";
    const nav = cfg.nav || [];
    const desktop = nav
      .map((n) => {
        const active = n.page === ctx.page;
        return `<a href="${esc(n.href)}" class="${active ? "text-gold font-semibold" : "hover:text-gold transition"}"${active ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`;
      })
      .join("");
    const mobile = nav
      .map((n) => `<a href="${esc(n.href)}" class="block py-3 ${n.page === ctx.page ? "text-gold font-semibold" : "hover:text-gold transition"}">${esc(n.label)}</a>`)
      .join("");
    const badge =
      overlay && cfg.headerBadge
        ? `<span class="hidden lg:inline-flex items-center gap-1.5 text-xs bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>${esc(cfg.headerBadge)}</span>`
        : "";
    const attrs = overlay
      ? 'id="navbar" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-5 md:px-12 text-white"'
      : 'class="sticky top-0 z-50 bg-forest/95 backdrop-blur-md py-4 px-5 md:px-12 text-white shadow-md"';
    return `<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:bg-white focus:text-forest focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg">Skip to content</a>
<header ${attrs}>
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <a href="index.html" class="flex items-center gap-2" aria-label="${esc(cfg.brandName)} home">
      <span class="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white font-serif font-bold text-lg">${esc(cfg.logoInitial)}</span>
      <span class="font-serif text-2xl md:text-3xl font-semibold tracking-wide">${esc(cfg.shortName)}</span>
    </a>
    <nav class="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide" aria-label="Main">${desktop}</nav>
    <div class="flex items-center gap-3">
      ${badge}
      <a href="${overlay ? "#booking-dock" : "index.html#booking-dock"}" class="bg-bronze hover:bg-bronzeHover text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-full transition shadow-lg">${overlay ? "Check Rates" : "Book Direct"}</a>
      <button type="button" id="menuToggle" class="md:hidden text-white p-2 -mr-2 cursor-pointer" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
  </div>
  <div id="mobileMenu" class="hidden md:hidden bg-forest/95 backdrop-blur-lg border-t border-white/10 mt-3 rounded-2xl px-5 py-2 text-sm font-medium shadow-xl">${mobile}</div>
</header>`;
  }

  function footer(cfg, ctx) {
    const links = (cfg.footerLinks || []).concat(cfg.policies && cfg.policies.enabled ? [{ label: "Policies & Privacy", href: "policies.html" }] : []);
    const quick = links.map((l) => `<li><a href="${esc(l.href)}" class="hover:text-gold transition">${esc(l.label)}</a></li>`).join("");
    return `<footer class="bg-forest text-alabaster pt-16 ${ctx.hasStickyBar ? "pb-24" : "pb-12"} md:pb-12 px-5 md:px-12">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-white/15">
    <div>
      <h2 class="font-serif text-3xl font-semibold">${esc(cfg.brandName)}</h2>
      <p class="text-white/70 text-sm mt-3 leading-relaxed">${esc(cfg.address)}</p>
      <p class="text-gold text-sm font-medium mt-4">Check-in: ${esc(cfg.checkInTime)} • Check-out: ${esc(cfg.checkOutTime)}</p>
    </div>
    <div>
      <h3 class="font-semibold text-sm uppercase tracking-wider text-gold mb-4">Quick Links</h3>
      <ul class="space-y-2 text-sm text-white/80">${quick}</ul>
    </div>
    <div>
      <h3 class="font-semibold text-sm uppercase tracking-wider text-gold mb-4">Direct Reservations</h3>
      <p class="text-sm text-white/80">Phone / WhatsApp: <a href="tel:+${digits(cfg.whatsappNumber)}" class="hover:text-gold transition">${esc(cfg.phoneDisplay)}</a></p>
      <p class="text-sm text-white/80 mt-1">Email: <a href="mailto:${esc(cfg.email)}" class="hover:text-gold transition">${esc(cfg.email)}</a></p>
      <a href="${esc(waUrl(cfg, `Hi ${cfg.brandName}! I have a booking enquiry.`))}" target="_blank" rel="noopener noreferrer"
         class="inline-block mt-5 bg-bronze hover:bg-bronzeHover text-white text-sm font-semibold px-6 py-3 rounded-xl transition">Chat with Reservations</a>
    </div>
  </div>
  <div class="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-white/60 gap-3">
    <p>© <span data-year>${ctx.year}</span> ${esc(cfg.brandName)}. All rights reserved.</p>
    <p>${esc(cfg.footerNote || "")}</p>
  </div>
</footer>`;
  }

  function floating(cfg, ctx) {
    const tip = (t) =>
      `<span class="hidden md:block absolute right-14 bg-charcoal text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow">${t}</span>`;
    return `<div class="fixed ${ctx.hasStickyBar ? "bottom-20" : "bottom-5"} md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-3">
  <a href="${esc(cfg.mapUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open resort location on Google Maps"
     class="group relative w-12 h-12 rounded-full bg-forest text-white shadow-2xl border-2 border-gold/60 flex items-center justify-center hover:bg-forestLight hover:scale-110 transition-all duration-300">${PIN_ICON}${tip("View Route Map")}</a>
  <a href="${esc(waUrl(cfg, `Hi ${cfg.brandName}! I have a query.`))}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
     class="group relative w-12 h-12 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-300">${WA_ICON}${tip("Chat on WhatsApp")}</a>
</div>`;
  }

  // ---------- home ----------
  function heroPill(cfg) {
    const rooms = cfg.rooms || [];
    if (!rooms.length) return "";
    const min = Math.min(...rooms.map((r) => r.price));
    const r = cfg.rating || {};
    const rating = r.show ? `<span class="text-gold font-bold">★ ${esc(r.score)}</span><span>•</span>` : "";
    const note = cfg.hero && cfg.hero.priceNote ? ` (${esc(cfg.hero.priceNote)})` : "";
    return `<div class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5 rounded-full text-xs md:text-sm font-medium mb-6">${rating}<span>Stays from <strong class="text-white">${money(min)} / night</strong>${note}</span></div>`;
  }

  function trustBar(cfg) {
    return (cfg.trustBar || [])
      .map(
        (t) => `<div class="text-center w-[calc(50%-1.25rem)] md:w-auto md:flex-1"><p class="text-gold font-bold text-base md:text-lg">${esc(t.title)}</p><p class="text-white/75">${esc(t.text)}</p></div>`
      )
      .join("");
  }

  const BADGE_CLS = ["bg-white/90 backdrop-blur-md text-forest", "bg-bronze text-white", "bg-forest text-white"];
  function stayCards(cfg) {
    return (cfg.rooms || [])
      .map(
        (r, i) => `<article class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col reveal">
  <div class="relative h-64 overflow-hidden group">
    <img src="${esc(img(r.image, 900))}" alt="${esc(r.name)}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
    ${r.badge ? `<span class="absolute top-3 left-3 ${BADGE_CLS[i % 3]} text-xs font-bold px-3 py-1 rounded-full">${esc(r.badge)}</span>` : ""}
  </div>
  <div class="p-6 flex-1 flex flex-col justify-between">
    <div>
      <div class="flex justify-between items-start gap-2">
        <h3 class="font-serif text-2xl font-semibold text-forest">${esc(r.name)}</h3>
        <div class="text-right"><span class="text-xl font-bold text-charcoal tabular-nums">${money(r.price)}</span><span class="block text-[11px] text-gray-500">per night</span></div>
      </div>
      <p class="text-gray-600 text-sm mt-3 leading-relaxed">${esc(r.shortDesc)}</p>
      <div class="flex flex-wrap gap-2 mt-4 text-xs font-medium text-gray-600">${(r.tags || []).map((t) => `<span class="bg-sand px-2.5 py-1 rounded-md">${esc(t)}</span>`).join("")}</div>
    </div>
    <div class="mt-6 pt-4 border-t border-gray-100">
      <button type="button" data-select-room="${esc(r.id)}" class="w-full bg-forest hover:bg-forestLight text-white text-sm font-semibold py-3 rounded-xl transition cursor-pointer">Select & Book</button>
    </div>
  </div>
</article>`
      )
      .join("");
  }

  function moreStays(cfg) {
    const n = (cfg.rooms || []).length;
    return `<div class="mt-12 text-center reveal"><div class="inline-flex flex-col sm:flex-row items-center gap-4 bg-sand/80 border border-gray-200/80 px-6 py-4 rounded-2xl">
${cfg.moreStaysNote ? `<p class="text-sm text-gray-700">${esc(cfg.moreStaysNote)}</p>` : ""}
<a href="rooms.html" class="inline-flex items-center gap-2 bg-forest hover:bg-forestLight text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition shadow-sm">Explore all ${n} stays & rates →</a>
</div></div>`;
  }

  function story(cfg) {
    const s = cfg.story;
    if (!s) return "";
    const stats = s.stats || [];
    return `<div class="reveal">
  <span class="text-bronze font-semibold text-xs uppercase tracking-widest">${esc(s.eyebrow)}</span>
  <h2 class="font-serif text-4xl md:text-5xl font-semibold text-forest mt-2 leading-tight">${esc(s.title)}</h2>
  <p class="text-gray-600 mt-5 leading-relaxed">${esc(s.text)}</p>
  <div class="grid gap-4 mt-8 pt-8 border-t border-gray-300/60" style="grid-template-columns:repeat(${stats.length || 1},minmax(0,1fr))">
    ${stats.map((x) => `<div><p class="font-serif text-3xl font-bold text-forest">${esc(x.value)}</p><p class="text-xs text-gray-600 mt-1">${esc(x.label)}</p></div>`).join("")}
  </div>
</div>
<div class="relative reveal"><img src="${esc(img(s.image, 1000))}" alt="${esc(s.imageAlt)}" loading="lazy" decoding="async" class="w-full h-[460px] object-cover rounded-t-full rounded-b-3xl shadow-xl" /></div>`;
  }

  function experiences(cfg) {
    const ex = cfg.experiences;
    if (!ex) return "";
    return `<div class="flex flex-col md:flex-row md:items-end justify-between mb-14 reveal">
  <div><span class="text-bronze font-semibold text-xs uppercase tracking-widest">${esc(ex.eyebrow)}</span>
  <h2 class="font-serif text-4xl md:text-5xl font-semibold text-forest mt-2">${esc(ex.title)}</h2></div>
  <a href="gallery.html" class="text-forest font-semibold text-sm underline underline-offset-4 hover:text-bronze transition mt-3 md:mt-0">Explore full photo gallery →</a>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
${(ex.items || [])
  .map(
    (i) => `<div class="relative h-80 rounded-2xl overflow-hidden group reveal">
  <img src="${esc(img(i.image, 700))}" alt="${esc(i.title)}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white"><h3 class="font-serif text-2xl font-semibold">${esc(i.title)}</h3><p class="text-xs text-white/85 mt-1">${esc(i.text)}</p></div></div>`
  )
  .join("")}
</div>`;
  }

  // ---------- rooms ----------
  function roomsList(cfg) {
    return (cfg.rooms || [])
      .map((r, i) => {
        const flip = i % 2 === 1;
        return `<article class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 reveal">
  <div class="lg:col-span-6 ${flip ? "lg:order-2" : ""} h-80 md:h-96 rounded-2xl overflow-hidden">
    <img src="${esc(img(r.image, 1000))}" alt="${esc(r.name)}" loading="lazy" decoding="async" class="w-full h-full object-cover hover:scale-105 transition duration-500" />
  </div>
  <div class="lg:col-span-6 ${flip ? "lg:order-1" : ""} space-y-4">
    <div class="flex justify-between items-center gap-3">
      <span class="bg-sand text-forest text-xs font-bold px-3 py-1 rounded-full">${esc(r.area)} • ${esc(guestsText(r))}</span>
      <span class="text-2xl font-bold text-forest tabular-nums shrink-0">${money(r.price)} <span class="text-xs font-normal text-gray-600">/ night</span></span>
    </div>
    <h2 class="font-serif text-3xl md:text-4xl font-semibold text-forest">${esc(r.name)}</h2>
    <p class="text-gray-600 text-sm leading-relaxed">${esc(r.description || r.shortDesc)}</p>
    <ul class="grid grid-cols-2 gap-2 text-xs text-gray-700 pt-2">${(r.amenities || []).map((a) => `<li>✓ ${esc(a)}</li>`).join("")}</ul>
    <div class="pt-4"><button type="button" data-quick-room="${esc(r.id)}" class="bg-forest hover:bg-forestLight text-white text-sm font-semibold px-6 py-3 rounded-xl transition cursor-pointer">Book This Room on WhatsApp →</button></div>
  </div>
</article>`;
      })
      .join("");
  }

  function compareTable(cfg) {
    const rooms = cfg.rooms || [];
    if (!rooms.length) return "";
    const labels = [];
    rooms.forEach((r) => Object.keys(r.compare || {}).forEach((k) => { if (!labels.includes(k)) labels.push(k); }));
    const row = (label, cell, bold) =>
      `<tr><td class="py-3.5 pr-4 font-medium">${esc(label)}</td>${rooms.map((r) => `<td class="py-3.5 px-4 ${bold ? "font-bold" : ""}">${cell(r)}</td>`).join("")}</tr>`;
    return `<table class="w-full text-left text-sm">
<thead><tr class="border-b border-gray-200 text-gray-600 uppercase text-xs"><th class="py-3 pr-4">Feature</th>${rooms.map((r) => `<th class="py-3 px-4 text-forest">${esc(r.name)}</th>`).join("")}</tr></thead>
<tbody class="divide-y divide-gray-100">
${row("Direct Tariff", (r) => `${money(r.price)} / night`, true)}
${row("Area", (r) => esc(r.area))}
${row("Guests", (r) => esc(guestsText(r)))}
${labels.map((l) => row(l, (r) => esc((r.compare || {})[l] || "—"))).join("")}
</tbody></table>`;
  }

  // ---------- contact ----------
  function packageGrid(cfg) {
    return (cfg.packages || [])
      .map(
        (p) => `<div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
  <div>
    <span class="${p.highlight ? "bg-gold/15 text-bronze" : "bg-sand text-forest"} text-xs font-bold px-3 py-1 rounded-full">${esc(p.duration)}</span>
    <h3 class="font-serif text-3xl font-semibold text-forest mt-4">${esc(p.name)}</h3>
    <p class="text-2xl font-bold text-charcoal mt-2 tabular-nums">${esc(p.priceLabel)} <span class="text-xs font-normal text-gray-600">${esc(p.priceNote)}</span></p>
    <ul class="mt-4 space-y-2 text-sm text-gray-600">${(p.features || []).map((f) => `<li>• ${esc(f)}</li>`).join("")}</ul>
  </div>
  <button type="button" data-quick-package="${esc(p.id)}" class="mt-6 w-full bg-forest hover:bg-forestLight text-white font-semibold text-sm py-3 rounded-xl transition cursor-pointer">Enquire Package on WhatsApp →</button>
</div>`
      )
      .join("");
  }

  // ---------- gallery ----------
  function galleryFilters(cfg) {
    const g = cfg.gallery;
    if (!g) return "";
    return (g.categories || [])
      .map(
        (c, i) => `<button type="button" data-filter="${esc(c.id)}" aria-pressed="${i === 0}" class="filter-btn ${i === 0 ? "active bg-bronze" : "bg-white/10 hover:bg-white/20"} text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-full transition cursor-pointer">${esc(c.label)}</button>`
      )
      .join("");
  }

  function galleryGrid(cfg) {
    const g = cfg.gallery;
    if (!g) return "";
    return (g.items || [])
      .map(
        (it) => `<button type="button" data-gallery-item data-category="${esc(it.category)}" data-caption="${esc(it.caption)}" class="gallery-item group relative h-72 rounded-2xl overflow-hidden cursor-pointer shadow-sm text-left">
  <img src="${esc(img(it.src, 900))}" alt="${esc(it.alt || it.caption)}" loading="lazy" decoding="async" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
  <span class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent md:bg-black/30 md:from-transparent md:via-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition flex items-end p-5 text-white font-serif text-xl">${esc(it.caption)}</span>
</button>`
      )
      .join("");
  }

  // ---------- policies ----------
  function policyContent(cfg) {
    const p = cfg.policies;
    if (!p || !p.enabled) return "";
    return (p.sections || [])
      .map(
        (s) => `<section class="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
  <h2 class="font-serif text-2xl md:text-3xl font-semibold text-forest mb-4">${esc(s.title)}</h2>
  <ul class="space-y-2 text-sm text-gray-700 leading-relaxed">${(s.items || []).map((i) => `<li>• ${esc(i)}</li>`).join("")}</ul>
</section>`
      )
      .join("");
  }

  // ---------- mounts: which element gets which template ----------
  // mode "replace": the mount element is swapped for the markup. mode "inner": markup goes inside the element.
  const MOUNTS = [
    { id: "site-header", mode: "replace", render: header },
    { id: "site-footer", mode: "replace", render: footer },
    { id: "site-floating", mode: "replace", render: floating },
    { id: "heroPill", mode: "inner", render: heroPill },
    { id: "trustBar", mode: "inner", render: trustBar },
    { id: "stayCards", mode: "inner", render: stayCards },
    { id: "moreStays", mode: "inner", render: moreStays },
    { id: "storyContent", mode: "inner", render: story },
    { id: "experiencesContent", mode: "inner", render: experiences },
    { id: "roomsList", mode: "inner", render: roomsList },
    { id: "compareTable", mode: "inner", render: compareTable },
    { id: "packageGrid", mode: "inner", render: packageGrid },
    { id: "galleryFilters", mode: "inner", render: galleryFilters },
    { id: "galleryGrid", mode: "inner", render: galleryGrid },
    { id: "policyContent", mode: "inner", render: policyContent }
  ];

  // ---------- SEO: structured data (used by the build) ----------
  function jsonLd(cfg, siteUrl) {
    const rooms = cfg.rooms || [];
    const prices = rooms.map((r) => r.price);
    const data = {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      name: cfg.brandName,
      description: ((cfg.pages || {}).home || {}).description || cfg.tagline,
      address: { "@type": "PostalAddress", streetAddress: cfg.address },
      telephone: "+" + digits(cfg.whatsappNumber),
      email: cfg.email,
      checkinTime: cfg.checkInTime,
      checkoutTime: cfg.checkOutTime
    };
    if (siteUrl) data.url = siteUrl + "/";
    if (cfg.hero && cfg.hero.image) data.image = cfg.hero.image;
    if (prices.length) data.priceRange = `${money(Math.min(...prices))} - ${money(Math.max(...prices))}`;
    const geo = cfg.seo && cfg.seo.geo;
    if (geo && geo.lat && geo.lng) data.geo = { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng };
    if (cfg.seo && cfg.seo.social && cfg.seo.social.length) data.sameAs = cfg.seo.social;
    return data; // note: no aggregateRating on purpose (invented ratings can get a site penalised)
  }

  return { esc, money, img, digits, waUrl, get, guestsText, hexToRgb, contrastOnWhite, deriveBronze, themeVars, jsonLd, MOUNTS, header, footer, floating, stayCards, roomsList, compareTable, packageGrid, galleryGrid, galleryFilters, policyContent };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Templates;
