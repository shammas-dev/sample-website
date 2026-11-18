/* Booking dock, WhatsApp actions, gallery. All data comes from config.js via Resort (components.js).
   Shell (header/footer/floating buttons) lives in components.js; page content in sections.js. */
const { cfg: CONFIG, waUrl, money } = Resort;
const RESORT_NAME = CONFIG.brandName;
const ROOMS = CONFIG.rooms || [];
const getRoom = (id) => ROOMS.find((r) => r.id === id);
const openWhatsApp = (msg) => window.open(waUrl(msg), "_blank", "noopener");

// DOM elements (only present on the home page)
const checkinInput = document.getElementById("checkin");
const checkoutInput = document.getElementById("checkout");
const roomTypeSelect = document.getElementById("roomType");
const guestsInput = document.getElementById("guests");
const nightsLabel = document.getElementById("nightsLabel");
const totalPriceEl = document.getElementById("totalPrice");
const bookingCtaText = document.getElementById("bookingCtaText");
const navbar = document.getElementById("navbar");
const estimateNoteEl = document.getElementById("estimateNote");
const capacityWarningEl = document.getElementById("capacityWarning");

let checkinPicker, checkoutPicker;
let adultGuests = 2;
let childGuests = 0;
let roomCount = 1;

function isLivePriceEnabled() {
  return !(CONFIG.pricing && CONFIG.pricing.showLivePrice === false);
}

// 1. Fill booking dock from config
function applyBookingConfig() {
  if (ROOMS.length) {
    const minPrice = Math.min(...ROOMS.map((r) => r.price));
    document.querySelectorAll("[data-starting-price]").forEach((el) => (el.textContent = money(minPrice)));

    if (roomTypeSelect) {
      roomTypeSelect.innerHTML = ROOMS.map(
        (r) => `<option value="${Resort.esc(r.id)}">${Resort.esc(r.name)} — ${money(r.price)}/nt</option>`
      ).join("");
    }
  }
  if (bookingCtaText) {
    bookingCtaText.textContent = isLivePriceEnabled() ? "Book via WhatsApp" : "Get Quote on WhatsApp";
  }
}

// 2. Guests & rooms stepper (+ / -)
function updateCount(type, delta) {
  if (type === "adults") {
    adultGuests = Math.max(1, Math.min(30, adultGuests + delta));
    const el = document.getElementById("adultCount");
    if (el) el.textContent = adultGuests;
  } else if (type === "children") {
    childGuests = Math.max(0, Math.min(15, childGuests + delta));
    const el = document.getElementById("childCount");
    if (el) el.textContent = childGuests;
  } else if (type === "rooms") {
    roomCount = Math.max(1, Math.min(15, roomCount + delta));
    const el = document.getElementById("roomCount");
    if (el) el.textContent = roomCount;
  }

  const parts = [`${adultGuests} Adult${adultGuests > 1 ? "s" : ""}`];
  if (childGuests > 0) parts.push(`${childGuests} Kid${childGuests > 1 ? "s" : ""}`);
  parts.push(`${roomCount} Room${roomCount > 1 ? "s" : ""}`);

  if (guestsInput) guestsInput.value = parts.join(", ");
  calculateTotal();
}

// 3. Date pickers (d/M/Y, e.g. 18/Nov/2026)
function initDefaultDates() {
  if (!checkinInput || !checkoutInput || typeof flatpickr === "undefined") return;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  checkinPicker = flatpickr(checkinInput, {
    dateFormat: "d/M/Y",
    minDate: "today",
    defaultDate: tomorrow,
    disableMobile: true,
    onChange: function (selectedDates) {
      if (selectedDates[0]) {
        const nextDay = new Date(selectedDates[0]);
        nextDay.setDate(nextDay.getDate() + 1);
        checkoutPicker.set("minDate", nextDay);
        if (checkoutPicker.selectedDates[0] <= selectedDates[0]) checkoutPicker.setDate(nextDay);
        calculateTotal();
      }
    }
  });

  checkoutPicker = flatpickr(checkoutInput, {
    dateFormat: "d/M/Y",
    minDate: dayAfter,
    defaultDate: dayAfter,
    disableMobile: true,
    onChange: calculateTotal
  });

  calculateTotal();
}

// 4. Rate calculator (booking dock). The rules live in js/pricing.js (unit-tested)
function getBookingCalculation() {
  const room = (roomTypeSelect && getRoom(roomTypeSelect.value)) || ROOMS[0] || { name: "", price: 0 };
  const calc = Pricing.calculateStay({
    room,
    checkin: checkinPicker ? checkinPicker.selectedDates[0] : null,
    checkout: checkoutPicker ? checkoutPicker.selectedDates[0] : null,
    adults: adultGuests,
    children: childGuests,
    rooms: roomCount,
    pricing: CONFIG.pricing || {}
  });
  return { ...calc, room, showLivePrice: isLivePriceEnabled() };
}

function taxText() {
  const p = CONFIG.pricing || {};
  return p.gstPercent > 0 ? `Incl. ${p.gstPercent}% GST.` : p.taxNote || "";
}

function calculateTotal() {
  if (!roomTypeSelect) return;
  const calc = getBookingCalculation();
  if (nightsLabel) nightsLabel.textContent = calc.summaryLabel;
  if (totalPriceEl) totalPriceEl.textContent = calc.showLivePrice ? money(calc.total) : "Custom Quote";
  if (estimateNoteEl) {
    estimateNoteEl.textContent = calc.showLivePrice ? ["Estimate.", taxText(), "Final rate confirmed on WhatsApp."].filter(Boolean).join(" ") : "";
  }
  if (capacityWarningEl) {
    capacityWarningEl.textContent = calc.capacity.message;
    capacityWarningEl.classList.toggle("hidden", calc.capacity.ok);
  }
}

// 5. One-tap room selection from home cards
function selectRoomAndScroll(roomId) {
  if (!roomTypeSelect) return;
  roomTypeSelect.value = roomId;
  calculateTotal();
  const dock = document.getElementById("booking-dock");
  if (dock) dock.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 6. WhatsApp actions (every website message ends with a Ref so the owner can tell where it came from)
function ratesLine(calc) {
  return calc.groups.map((g) => `${g.label} ${money(g.rate)} × ${g.nights} night${g.nights > 1 ? "s" : ""}`).join(", ");
}

function bookViaWhatsApp() {
  if (!roomTypeSelect) return openWhatsApp(`Hi ${RESORT_NAME}! I'd like to check room availability.\n\n• *Ref:* ${Resort.ref()}`);

  const calc = getBookingCalculation();
  const checkin = checkinInput.value || "Flexible";
  const checkout = checkoutInput.value || "Flexible";
  const guestsText = guestsInput ? guestsInput.value : `${adultGuests} Adults, ${roomCount} Room`;
  const stay = `${calc.room.name} × ${calc.rooms} Room${calc.rooms > 1 ? "s" : ""}`;
  const note = calc.capacity.ok ? "" : "\n• *Note:* Group is above the room capacity, please suggest options";
  const tax = taxText().replace(/\.$/, "");

  const lines = calc.showLivePrice
    ? [
        `Hi ${RESORT_NAME}! I'd like to check availability & book:\n`,
        `• *Stay:* ${stay}`,
        `• *Check-in:* ${checkin}`,
        `• *Check-out:* ${checkout}`,
        `• *Guests:* ${guestsText}`,
        `• *Rates (per room/night):* ${ratesLine(calc)}`,
        `• *Breakdown:* ${calc.summaryLabel}`,
        `• *Estimated Total:* ${money(calc.total)}${tax ? ` (${tax})` : ""}`
      ]
    : [
        `Hi ${RESORT_NAME}! Please share best rates & availability for:\n`,
        `• *Stay:* ${stay}`,
        `• *Check-in:* ${checkin}`,
        `• *Check-out:* ${checkout}`,
        `• *Guests:* ${guestsText} (${calc.nights} Night${calc.nights > 1 ? "s" : ""})`
      ];
  openWhatsApp(`${lines.join("\n")}${note}\n• *Ref:* ${Resort.ref()}`);
}

function quickBookRoom(roomId) {
  const room = getRoom(roomId);
  if (!room) return;
  openWhatsApp(`Hi ${RESORT_NAME}! I'm interested in booking the *${room.name}* (from ${money(room.price)}/night). Please share availability & best offer for my dates.\n\n• *Ref:* ${Resort.ref()}`);
}

function quickBookPackage(packageId) {
  const pkg = (CONFIG.packages || []).find((p) => p.id === packageId);
  if (!pkg) return;
  openWhatsApp(`Hi ${RESORT_NAME}! I'd like to enquire about the *${pkg.name}* — ${pkg.duration} (${pkg.priceLabel}). Please share package availability.\n\n• *Ref:* ${Resort.ref()}`);
}

function submitCustomEnquiry(event) {
  event.preventDefault();
  const val = (id) => document.getElementById(id).value;
  const notes = val("enqNotes") || "None";
  openWhatsApp(`Hi ${RESORT_NAME}! Custom Stay Enquiry:\n\n• *Name:* ${val("enqName")}\n• *Dates:* ${val("enqDates")}\n• *Guests:* ${val("enqGuests")}\n• *Notes:* ${notes}\n• *Ref:* ${Resort.ref()}`);
}

// 7. Gallery filter + lightbox (Esc, arrow keys, prev/next buttons, swipe, focus returns to the photo you opened)
let lightboxIndex = 0;
let lightboxReturnFocus = null;
const visibleGalleryItems = () => [...document.querySelectorAll(".gallery-item")].filter((i) => i.style.display !== "none");
const lightboxModal = () => document.getElementById("lightboxModal");
const lightboxIsOpen = () => !!lightboxModal() && !lightboxModal().classList.contains("hidden");

function applyGalleryFilter(btn) {
  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.classList.remove("active", "bg-bronze");
    b.classList.add("bg-white/10");
    b.setAttribute("aria-pressed", "false");
  });
  btn.classList.add("active", "bg-bronze");
  btn.classList.remove("bg-white/10");
  btn.setAttribute("aria-pressed", "true");

  const filter = btn.dataset.filter;
  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.style.display = filter === "all" || item.dataset.category === filter ? "block" : "none";
  });
}

function showLightbox(index) {
  const items = visibleGalleryItems();
  if (!items.length) return;
  lightboxIndex = (index + items.length) % items.length;
  const item = items[lightboxIndex];
  const image = item.querySelector("img");
  const big = document.getElementById("lightboxImg");
  big.src = Resort.img(image.currentSrc || image.src, 1600);
  big.alt = image.alt;
  document.getElementById("lightboxCaption").textContent = item.dataset.caption || "";
}

function openLightbox(item) {
  const modal = lightboxModal();
  if (!modal) return;
  lightboxReturnFocus = document.activeElement;
  showLightbox(visibleGalleryItems().indexOf(item));
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  const closeBtn = document.getElementById("lightboxClose");
  if (closeBtn) closeBtn.focus();
}

function closeLightbox() {
  const modal = lightboxModal();
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  if (lightboxReturnFocus && lightboxReturnFocus.focus) lightboxReturnFocus.focus();
}

document.addEventListener("keydown", (e) => {
  if (!lightboxIsOpen()) return;
  if (e.key === "Escape") closeLightbox();
  else if (e.key === "ArrowRight") showLightbox(lightboxIndex + 1);
  else if (e.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
});

(function initLightboxSwipe() {
  const modal = lightboxModal();
  if (!modal) return;
  let startX = null;
  modal.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
  modal.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) showLightbox(lightboxIndex + (dx < 0 ? 1 : -1));
  });
})();

// 8. Click handling for rendered content (works for elements created by templates)
document.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;
  if ((el = t("[data-select-room]"))) return selectRoomAndScroll(el.dataset.selectRoom);
  if ((el = t("[data-quick-room]"))) return quickBookRoom(el.dataset.quickRoom);
  if ((el = t("[data-quick-package]"))) return quickBookPackage(el.dataset.quickPackage);
  if ((el = t("[data-gallery-item]"))) return openLightbox(el);
  if ((el = t("[data-filter]"))) return applyGalleryFilter(el);
  if (t("[data-lightbox-close]") || e.target.id === "lightboxModal") return closeLightbox();
  if (t("[data-lightbox-prev]")) return showLightbox(lightboxIndex - 1);
  if (t("[data-lightbox-next]")) return showLightbox(lightboxIndex + 1);
});

// 9. Home header: solid background after scrolling
if (navbar) {
  const onScroll = () => navbar.classList.toggle("navbar-scrolled", window.scrollY > 50);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// 10. Scroll reveal (content stays visible if IntersectionObserver is unavailable)
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) return items.forEach((el) => el.classList.add("active"));
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.1 }
  );
  items.forEach((el) => observer.observe(el));
}

// Boot
if (roomTypeSelect) roomTypeSelect.addEventListener("change", calculateTotal);
applyBookingConfig();
initDefaultDates();
initReveal();
