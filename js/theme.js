/* Runs in <head>, before first paint: applies config colours + page title/description (no colour flash).
   Needs config.js and templates.js loaded first. */
(function () {
  if (typeof RESORT_CONFIG === "undefined" || typeof Templates === "undefined") return;
  var root = document.documentElement;
  root.classList.add("js");

  var vars = Templates.themeVars(RESORT_CONFIG);
  Object.keys(vars).forEach(function (name) { root.style.setProperty(name, vars[name]); });

  var page = (RESORT_CONFIG.pages || {})[root.dataset.page];
  if (page) {
    if (page.title) document.title = page.title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta && page.description) meta.setAttribute("content", page.description);
  }
})();
