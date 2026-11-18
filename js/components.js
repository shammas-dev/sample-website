/* Browser glue. Templates (js/templates.js) produce the HTML; this file puts it on the page
   and wires behaviour. On production builds the HTML is already pre-rendered, so mounts are skipped
   and only the behaviour (menu toggle, text bindings) is attached. */
const Resort = (() => {
  const cfg = typeof RESORT_CONFIG !== "undefined" ? RESORT_CONFIG : {};
  const T = Templates;
  return {
    cfg,
    page: document.documentElement.dataset.page || "",
    esc: T.esc,
    money: T.money,
    img: T.img,
    guestsText: T.guestsText,
    waUrl: (msg) => T.waUrl(cfg, msg),
    get: (path) => T.get(cfg, path),
    // Short reference added to every website WhatsApp message, e.g. WEB-1811-K7M
    ref: () => {
      const d = new Date();
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let tail = "";
      for (let i = 0; i < 3; i++) tail += alphabet[Math.floor(Math.random() * alphabet.length)];
      return `WEB-${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}-${tail}`;
    }
  };
})();

(function mountPage() {
  const { cfg, page } = Resort;
  const hasStickyBar = !!document.querySelector("[data-sticky-bar]");

  // 1. Render templates into mount points (skipped for anything the build already rendered)
  Templates.MOUNTS.forEach((m) => {
    const el = document.getElementById(m.id);
    if (!el || el.hasAttribute("data-rendered")) return;
    const html = m.render(cfg, { page, variant: el.dataset.variant || "solid", hasStickyBar, year: new Date().getFullYear() });
    if (m.mode === "replace") {
      const t = document.createElement("template");
      t.innerHTML = html.trim();
      el.replaceWith(t.content);
    } else {
      el.innerHTML = html;
      el.setAttribute("data-rendered", "1");
    }
  });

  // 2. Text / attribute bindings:  data-cfg="pages.rooms.heading"  data-cfg-src="hero.image"  data-cfg-alt="hero.imageAlt"
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const v = Resort.get(el.dataset.cfg);
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll("[data-cfg-src]").forEach((el) => {
    const v = Resort.get(el.dataset.cfgSrc);
    if (v) el.setAttribute("src", el.dataset.w ? Resort.img(v, el.dataset.w) : v);
  });
  document.querySelectorAll("[data-cfg-alt]").forEach((el) => {
    const v = Resort.get(el.dataset.cfgAlt);
    if (v) el.setAttribute("alt", v);
  });

  // 3. Mobile menu behaviour (works for rendered AND pre-rendered header)
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    const setOpen = (open) => {
      menu.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(menu.classList.contains("hidden")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  // 4. Keep the footer year current even on an old build
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
