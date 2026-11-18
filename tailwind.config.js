/** Production build config. The theme itself lives in js/tailwind-theme.js (shared with the browser/CDN mode). */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: { extend: require("./js/tailwind-theme.js") },
  plugins: []
};
