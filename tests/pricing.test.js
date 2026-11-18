// Run: npm test   (no dependencies)
const assert = require("assert");
const Pricing = require("../js/pricing.js");

const room = { name: "Mist Valley Cottage", price: 4999, maxAdults: 2, maxChildren: 1 };
const pool = { name: "Plunge Pool Suite", price: 10999, maxAdults: 2, maxChildren: 0 };
const base = { baseAdultsPerRoom: 2, extraAdultPrice: 1200, extraChildPrice: 800, gstPercent: 0, roundTo: 10 };
const seasonal = { ...base, weekendPercent: 15, weekendDays: [5, 6], seasons: [{ name: "Christmas & New Year", from: "12-20", to: "01-03", percent: 30 }] };
const d = (y, m, day) => new Date(y, m - 1, day);
const calc = (o) => Pricing.calculateStay({ room, adults: 2, children: 0, rooms: 1, pricing: base, ...o });

let n = 0;
const test = (name, fn) => { fn(); n++; console.log("  ok  " + name); };

test("no dates = one regular night", () => {
  const r = calc({});
  assert.equal(r.total, 4999);
  assert.equal(r.nights, 1);
});

test("plain weekday stay (Wed 18 Nov 2026, 1 night)", () => {
  const r = calc({ checkin: d(2026, 11, 18), checkout: d(2026, 11, 19), pricing: seasonal });
  assert.equal(r.total, 4999);
  assert.equal(r.groups[0].label, "Regular");
});

test("Fri-Mon: 2 weekend nights (+15%, rounded to 10) + 1 regular", () => {
  const r = calc({ checkin: d(2026, 11, 20), checkout: d(2026, 11, 23), pricing: seasonal });
  assert.equal(r.nights, 3);
  assert.equal(r.total, 5750 * 2 + 4999);
  assert.deepEqual(r.groups.map((g) => [g.label, g.nights]), [["Weekend", 2], ["Regular", 1]]);
});

test("season wraps over New Year; higher % wins over weekend (Fri 1 Jan 2027)", () => {
  const r = calc({ checkin: d(2026, 12, 30), checkout: d(2027, 1, 2), pricing: seasonal });
  assert.equal(r.total, 6500 * 3);
  assert.equal(r.groups.length, 1);
  assert.equal(r.groups[0].label, "Christmas & New Year");
});

test("season boundaries: 19 Dec regular, 20 Dec season, 3 Jan season, 4 Jan regular", () => {
  const p = seasonal;
  assert.equal(Pricing.seasonFor(d(2026, 12, 19), p.seasons), undefined);
  assert.ok(Pricing.seasonFor(d(2026, 12, 20), p.seasons));
  assert.ok(Pricing.seasonFor(d(2027, 1, 3), p.seasons));
  assert.equal(Pricing.seasonFor(d(2027, 1, 4), p.seasons), undefined);
});

test("extra adult + kid, per night", () => {
  const r = calc({ adults: 3, children: 1, checkin: d(2026, 11, 18), checkout: d(2026, 11, 20) });
  assert.equal(r.extraAdults, 1);
  assert.equal(r.total, (4999 + 1200 + 800) * 2);
});

test("multi-room: 2 rooms, 5 adults -> 1 extra adult; rooms multiply rate", () => {
  const r = calc({ adults: 5, rooms: 2 });
  assert.equal(r.total, 2 * 4999 + 1200);
});

test("GST % is added on top", () => {
  const r = calc({ pricing: { ...base, gstPercent: 12 } });
  assert.equal(r.tax, Math.round(4999 * 0.12));
  assert.equal(r.total, 4999 + Math.round(4999 * 0.12));
});

test("zero weekend % and no seasons = flat price on weekends", () => {
  const r = calc({ checkin: d(2026, 11, 20), checkout: d(2026, 11, 22), pricing: base });
  assert.equal(r.total, 4999 * 2);
});

test("capacity: ok within limits", () => {
  assert.ok(calc({ adults: 2, children: 1 }).capacity.ok);
  assert.ok(Pricing.checkCapacity({ room: pool, adults: 3, children: 0, rooms: 2 }).ok);
});

test("capacity: too many adults / kids warns with room name", () => {
  const a = Pricing.checkCapacity({ room: pool, adults: 3, children: 0, rooms: 1 });
  assert.equal(a.ok, false);
  assert.ok(a.message.includes("Plunge Pool Suite") && a.message.includes("2 adults"));
  assert.equal(Pricing.checkCapacity({ room: pool, adults: 2, children: 1, rooms: 1 }).ok, false);
});

test("capacity: rooms without limits in config never warn", () => {
  assert.ok(Pricing.checkCapacity({ room: { name: "X", price: 1 }, adults: 20, children: 9, rooms: 1 }).ok);
});

console.log(`\n${n} tests passed`);
