/* Single source of the Tailwind theme.
   - Browser (CDN mode): loaded right after the Tailwind CDN script and applies itself.
   - Node (tailwind.config.js): require()d for the production build.
   Colours are CSS variables (set from config.js by theme.js), so changing
   `theme` in config.js recolours the whole site, including opacity classes like bg-gold/15. */
const RESORT_TAILWIND_EXTEND = {
  colors: {
    alabaster: "rgb(var(--c-alabaster) / <alpha-value>)",
    sand: "rgb(var(--c-sand) / <alpha-value>)",
    forest: "rgb(var(--c-forest) / <alpha-value>)",
    forestLight: "rgb(var(--c-forest-light) / <alpha-value>)",
    gold: "rgb(var(--c-gold) / <alpha-value>)",
    goldHover: "rgb(var(--c-gold-hover) / <alpha-value>)",
    charcoal: "rgb(var(--c-charcoal) / <alpha-value>)",
    bronze: "rgb(var(--c-bronze) / <alpha-value>)",
    bronzeHover: "rgb(var(--c-bronze-hover) / <alpha-value>)"
  },
  fontFamily: {
    serif: ['"Cormorant Garamond"', "serif"],
    sans: ['"Plus Jakarta Sans"', "sans-serif"]
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = RESORT_TAILWIND_EXTEND;
} else if (typeof tailwind !== "undefined") {
  tailwind.config = { theme: { extend: RESORT_TAILWIND_EXTEND } };
}
