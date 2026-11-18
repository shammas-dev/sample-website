/* Pricing & capacity rules: pure functions (no DOM), so they can be unit-tested with `npm test`.
   Settings come from config.js > pricing. See README ("Pricing") for what each setting does. */
const Pricing = (() => {
  const DAY = 86400000;
  const toMD = (d) => (d.getMonth() + 1) * 100 + d.getDate(); // 18 Nov -> 1118
  const parseMD = (s) => {
    const [m, d] = String(s).split("-").map(Number);
    return m * 100 + d; // "12-20" -> 1220
  };

  // A season is MM-DD to MM-DD and repeats yearly; "12-20" to "01-03" correctly wraps over New Year
  function seasonFor(date, seasons) {
    const v = toMD(date);
    return (seasons || []).find((s) => {
      if (!(s.percent > 0)) return false;
      const from = parseMD(s.from);
      const to = parseMD(s.to);
      return from <= to ? v >= from && v <= to : v >= from || v <= to;
    });
  }

  // Rate for the night that STARTS on `date`. Weekend and season never stack: the higher % wins.
  function nightRate(base, date, p) {
    const roundTo = p.roundTo > 0 ? p.roundTo : 1;
    let pct = 0;
    let label = "Regular";
    if (p.weekendPercent > 0 && (p.weekendDays || [5, 6]).includes(date.getDay())) {
      pct = p.weekendPercent;
      label = "Weekend";
    }
    const season = seasonFor(date, p.seasons);
    if (season && season.percent >= pct) {
      pct = season.percent;
      label = season.name;
    }
    const rate = pct > 0 ? Math.round((base * (1 + pct / 100)) / roundTo) * roundTo : base;
    return { label, pct, rate };
  }

  // Warn (never block) when the group is bigger than the room allows
  function checkCapacity({ room, adults, children, rooms }) {
    const overAdults = room.maxAdults && adults > rooms * room.maxAdults;
    const overKids = room.maxChildren != null && children > rooms * room.maxChildren;
    if (!overAdults && !overKids) return { ok: true, message: "" };
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const limit = [room.maxAdults ? plural(room.maxAdults, "adult") : "", room.maxChildren ? plural(room.maxChildren, "kid") : ""]
      .filter(Boolean)
      .join(" + ");
    return {
      ok: false,
      message: `${room.name} fits up to ${limit} per room. Add another room, or ask the resort on WhatsApp for options.`
    };
  }

  function calculateStay({ room, checkin, checkout, adults, children, rooms, pricing }) {
    const p = pricing || {};
    const hasDates = checkin && checkout && checkout > checkin;
    const nights = hasDates ? Math.max(1, Math.round((checkout - checkin) / DAY)) : 1;

    // One entry per night (no dates selected = one regular night)
    const nightly = [];
    for (let i = 0; i < nights; i++) {
      if (hasDates) {
        nightly.push(nightRate(room.price, new Date(checkin.getFullYear(), checkin.getMonth(), checkin.getDate() + i), p));
      } else {
        nightly.push({ label: "Regular", pct: 0, rate: room.price });
      }
    }

    // Group identical nights: "Weekend ₹5,750 × 2 nights"
    const groups = [];
    nightly.forEach((n) => {
      const g = groups.find((x) => x.label === n.label && x.rate === n.rate);
      if (g) g.nights += 1;
      else groups.push({ label: n.label, rate: n.rate, nights: 1 });
    });

    const includedAdults = rooms * (p.baseAdultsPerRoom || 2);
    const extraAdults = Math.max(0, adults - includedAdults);
    const extrasPerNight = extraAdults * (p.extraAdultPrice || 0) + children * (p.extraChildPrice || 0);

    const roomTotal = nightly.reduce((sum, n) => sum + n.rate, 0) * rooms;
    const subtotal = roomTotal + extrasPerNight * nights;
    const tax = p.gstPercent > 0 ? Math.round(subtotal * (p.gstPercent / 100)) : 0;

    const tags = [`${nights} Night${nights > 1 ? "s" : ""}`, `${rooms} Room${rooms > 1 ? "s" : ""}`];
    if (extraAdults > 0 && p.extraAdultPrice > 0) tags.push(`+${extraAdults} Extra Adult`);
    if (children > 0 && p.extraChildPrice > 0) tags.push(`+${children} Kid${children > 1 ? "s" : ""}`);

    return {
      nights,
      rooms,
      nightly,
      groups,
      extraAdults,
      subtotal,
      tax,
      total: subtotal + tax,
      summaryLabel: tags.join(" • "),
      capacity: checkCapacity({ room, adults, children, rooms })
    };
  }

  return { calculateStay, checkCapacity, nightRate, seasonFor };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Pricing;
