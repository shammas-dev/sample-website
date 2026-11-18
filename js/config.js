/* =====================================================================
   RESORT CONFIG: the ONLY file you edit for a new client.
   Every page (header, footer, rooms, packages, gallery, contact) reads
   from here. Items marked DEMO are sample data: replace with the
   client's real details, or remove/hide them.
   ===================================================================== */
const RESORT_CONFIG = {
  // ---------- Build / SEO ----------
  isDemo: true,  // set to false for a real client: `npm run build` then rejects demo stock images and a missing siteUrl
  siteUrl: "",   // the live address, no trailing slash, e.g. "https://www.vanamist.in". Needed for share previews, canonical, sitemap
  seo: {
    ogImage: "",      // image shown when the link is shared on WhatsApp (1200x630 works best). "" = use the hero image
    cleanUrls: true,  // Cloudflare Pages serves /rooms instead of /rooms.html. Set false for hosts that keep .html
    social: [],       // optional: ["https://www.instagram.com/...", "https://www.facebook.com/..."]
    geo: null         // optional: { lat: 11.5, lng: 76.1 } helps Google Maps / local search
  },

  // ---------- Identity ----------
  brandName: "Vana Mist Resort",
  shortName: "Vana Mist",
  logoInitial: "V",
  tagline: "Where the Mist Meets the Forest Canopy",
  locationShort: "Wayanad, Kerala",
  address: "Meppadi - Chooralmala Road, Vythiri Taluk, Wayanad, Kerala 673577",
  whatsappNumber: "918606411892", // country code + number, digits only (no +)
  phoneDisplay: "+91 86064 11892",
  email: "stay@vanamistwayanad.com",
  checkInTime: "2:00 PM",
  checkOutTime: "11:00 AM",

  // Google Maps: mapUrl = "Share > Send a link", mapEmbedUrl = "Share > Embed a map" (copy only the src="...")
  mapUrl: "https://maps.google.com/?q=Wayanad,Kerala",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125042.34525343757!2d76.0468!3d11.6103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba60cf91a9c5f0d%3A0x71dd4da2e1d3e46f!2sWayanad%2C%20Kerala!5e0!3m2!1sen!2sin!4v1700000000000",
  contact: {
    hours: "9:00 AM – 9:00 PM",
    nearestAirport: "Calicut International Airport (CCJ) — 95 km"
  },

  // ---------- Pricing engine ----------
  pricing: {
    showLivePrice: true,   // true = live estimate | false = "Custom Quote" mode
    baseAdultsPerRoom: 2,  // adults included in the base room tariff
    extraAdultPrice: 1200, // per extra adult per night (0 = free)
    extraChildPrice: 800,  // per child per night (0 = kids free)
    gstPercent: 0,         // 0 = tax not added. Confirm the right GST with the client's CA
    taxNote: "Taxes extra.", // shown under the estimate when gstPercent is 0. "" = hidden

    // Simple seasonal pricing (optional). The room price goes up by a %.
    // If weekend and season both apply to a night, the HIGHER % is used (they do not add up).
    weekendPercent: 15,    // DEMO: 0 = no weekend uplift
    weekendDays: [5, 6],   // nights starting on: 0=Sun 1=Mon ... 5=Fri 6=Sat
    seasons: [             // DEMO: [] = no seasons. Dates are MM-DD and repeat every year
      { name: "Christmas & New Year", from: "12-20", to: "01-03", percent: 30 }
    ],
    roundTo: 10            // round nightly rates to the nearest ₹10
  },

  // ---------- Theme (hex). Applied site-wide on load ----------
  theme: {
    forest: "#163024",
    forestLight: "#234736",
    gold: "#C88A55",
    goldHover: "#B57743",
    alabaster: "#FAF8F5",
    sand: "#F1EDE6",
    charcoal: "#1C1C1C"
  },

  // ---------- Navigation (order = menu order) ----------
  nav: [
    { label: "Home", href: "index.html", page: "home" },
    { label: "Rooms & Tariffs", href: "rooms.html", page: "rooms" },
    { label: "Gallery", href: "gallery.html", page: "gallery" },
    { label: "Packages & Contact", href: "contact.html", page: "contact" }
  ],
  headerBadge: "Direct Rate Guarantee", // small pill in the home header. "" = hidden. Only keep if true!

  // ---------- Per-page text (browser title, search description, headings) ----------
  pages: {
    home: {
      title: "Vana Mist Resort | Luxury Nature Stays in Wayanad",
      description: "Book direct at Vana Mist Resort, Wayanad. Private villas and cottages with zero booking fees."
    },
    rooms: {
      title: "Stays & Tariffs | Vana Mist Resort Wayanad",
      description: "Room types, direct tariffs and amenities at Vana Mist Resort, Wayanad.",
      eyebrow: "Direct Resort Rates",
      heading: "Sanctuaries & Villas",
      intro: "All tariffs include complimentary Malabar breakfast, infinity pool access, and guided morning plantation walk."
    },
    gallery: {
      title: "Gallery | Vana Mist Resort Wayanad",
      description: "Photos of the villas, pool, dining and spa at Vana Mist Resort, Wayanad.",
      eyebrow: "Visual Tour",
      heading: "Life Above the Clouds"
    },
    contact: {
      title: "Packages & Contact | Vana Mist Resort Wayanad",
      description: "Honeymoon and family packages, directions and direct reservations at Vana Mist Resort.",
      eyebrow: "Curated Escapes & Directions",
      heading: "Packages & Reservations"
    },
    policies: {
      title: "Policies & Privacy | Vana Mist Resort Wayanad",
      description: "Booking, cancellation, house rules and privacy information for Vana Mist Resort.",
      eyebrow: "Good to Know",
      heading: "Policies & Privacy"
    }
  },

  // ---------- Home: hero ----------
  hero: {
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=80",
    imageAlt: "Vana Mist infinity pool above the valley",
    headline: "Where the Mist Meets the Forest Canopy",
    subtext:
      "Private pool villas and heritage cottages nestled in the misty hills of Wayanad. Check live tariffs below and book directly with zero commission.",
    priceNote: "Incl. Breakfast" // shown after the starting price. "" = hidden
  },

  // DEMO: use real figures or set show:false. Never publish invented ratings.
  rating: { show: true, score: "4.9", reviews: "480+", source: "Google" },

  // Home: strip under the hero. Any number of items (3-4 looks best)
  trustBar: [
    { title: "Zero Commission", text: "Direct Resort Best Tariff" },
    { title: "Free Breakfast", text: "Authentic Kerala & Continental" },
    { title: "Direct WhatsApp", text: "Talk to the resort team directly" },
    { title: "Flexible Reschedule", text: "Free date change up to 48 hrs" } // DEMO: must match the client's real policy
  ],

  // Home: story section
  story: {
    eyebrow: "Slow Living in Wayanad",
    title: "Designed for Unhurried Mornings & Quiet Nights",
    text:
      "Set across 14 acres of private cardamom and coffee estates, Vana Mist blends traditional Kerala timber architecture with modern barefoot luxury. Wake up to birdsong, swim above the clouds, and dine on farm-fresh Malabar cuisine.",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1000&q=80",
    imageAlt: "Resort deck with valley view",
    stats: [
      { value: "14 Acres", label: "Private Estate" },
      { value: "12 Villas", label: "Low-Density Privacy" },
      { value: "4.9 ★", label: "480+ Google Reviews" } // DEMO
    ]
  },

  // Home: experiences grid
  experiences: {
    eyebrow: "Curated Moments",
    title: "Beyond the Stay",
    items: [
      { title: "Ayurveda Spa", text: "Traditional Abhyangam & herbal steam therapies.", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80" },
      { title: "Sunrise Ridge Trek", text: "Guided morning trail through misty tea slopes.", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=700&q=80" },
      { title: "Gazebo Dining", text: "Private 4-course Malabar dinner under the stars.", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80" },
      { title: "Mist Bonfire", text: "Evening acoustic music & freshly roasted coffee.", image: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=700&q=80" }
    ]
  },

  // ---------- Rooms (drive: home cards, booking dropdown, rooms page, comparison table, WhatsApp text) ----------
  moreStaysNote: "Compare sizes, amenities and tariffs side by side.", // "" = hidden
  rooms: [
    {
      id: "cottage", // unique, no spaces
      name: "Mist Valley Cottage",
      price: 4999,
      area: "420 sq.ft",
      maxAdults: 2, // capacity per room (warning only). Shown as "Max 2 Adults + 1 Child"
      maxChildren: 1,
      badge: "Best Value",
      shortDesc: "Cozy teak-wood cottage with a private valley-facing balcony, rain shower, and morning mist views.",
      description: "Crafted with reclaimed teak wood and local laterite stone, featuring a private valley-facing sit-out deck where morning mist drifts right past your balcony.",
      tags: ["420 sq.ft", "King Bed", "Valley Balcony"],
      amenities: ["King-size orthopedic bed", "Private valley-view balcony", "High-speed Wi-Fi & workspace", "Rain shower & organic toiletries", "Complimentary breakfast", "Coffee & estate tea maker"],
      compare: { "Private Pool / Tub": "Main Infinity Pool", "Breakfast Included": "Yes" },
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "villa",
      name: "Forest Canopy Villa",
      price: 7499,
      area: "650 sq.ft",
      maxAdults: 2,
      maxChildren: 2,
      badge: "Most Popular",
      shortDesc: "Elevated glass-walled villa surrounded by 100-year-old trees, outdoor deck, and freestanding soaking tub.",
      description: "Elevated amidst 100-year-old rosewood trees with floor-to-ceiling glass walls, an expansive wooden lounge deck, and a deep freestanding stone soaking tub.",
      tags: ["650 sq.ft", "Forest Deck", "Soaking Tub"],
      amenities: ["Panoramic 180° forest glass walls", "Freestanding stone soaking tub", "Private sunset deck with loungers", "King bed + daybed sofa", "Complimentary evening snacks", "Priority spa booking"],
      compare: { "Private Pool / Tub": "Stone Soaking Tub", "Breakfast Included": "Yes" },
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
    },
    {
      id: "pool-suite",
      name: "Plunge Pool Suite",
      price: 10999,
      area: "920 sq.ft",
      maxAdults: 2,
      maxChildren: 0,
      badge: "Honeymoon Pick",
      shortDesc: "Ultra-private luxury sanctuary featuring a heated private infinity plunge pool, gazebo, and butler service.",
      description: "Our flagship private sanctuary featuring a temperature-controlled infinity plunge pool overlooking the valley, private dining gazebo, and dedicated butler service.",
      tags: ["920 sq.ft", "Private Pool", "Candlelight Setup"],
      amenities: ["Heated private infinity plunge pool", "Private outdoor dining gazebo", "Complimentary candlelight setup", "Dedicated butler & buggy service", "Luxury bathrobes & minibar", "Late checkout (subject to avail.)"],
      compare: { "Private Pool / Tub": "Heated Private Plunge Pool", "Breakfast Included": "Yes + In-Villa Option" },
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80"
    }
  ],

  // ---------- Packages (contact page) ----------
  packages: [
    {
      id: "honeymoon",
      name: "Misty Honeymoon Escape",
      duration: "2 Nights / 3 Days",
      priceLabel: "₹23,999",
      priceNote: "per couple (All-Inclusive)",
      highlight: true, // true = gold tag, false = neutral tag
      features: [
        "2 Nights in Private Plunge Pool Suite",
        "Flower bed decor & honeymoon cake on arrival",
        "Private candlelight gazebo dinner (1 night)",
        "Couple Ayurveda relaxation massage (45 mins)"
      ]
    },
    {
      id: "family",
      name: "Wayanad Family Retreat",
      duration: "2 Nights / 3 Days",
      priceLabel: "₹16,499",
      priceNote: "for 2 Adults + 2 Kids",
      highlight: false,
      features: [
        "2 Nights in Forest Canopy Villa",
        "Daily breakfast & traditional Malabar dinner",
        "Guided tea estate walk & private campfire night",
        "Complimentary pickup from Kalpetta bus stand"
      ]
    }
  ],

  // ---------- Gallery ----------
  gallery: {
    categories: [
      { id: "all", label: "All Photos" },
      { id: "villas", label: "Villas & Suites" },
      { id: "pool", label: "Pool & Estate" },
      { id: "dining", label: "Dining & Spa" }
    ],
    items: [
      { category: "pool", caption: "Main Infinity Pool at Dusk", alt: "Infinity Edge Pool", src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80" },
      { category: "villas", caption: "Mist Valley Cottage Suite", alt: "Mist Valley Cottage Interior", src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80" },
      { category: "dining", caption: "Private Gazebo Dining", alt: "Candlelight Dinner", src: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80" },
      { category: "villas", caption: "Private Plunge Pool Villa", alt: "Plunge Pool Suite", src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80" },
      { category: "pool", caption: "Morning Tea Deck", alt: "Estate Lounge Deck", src: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80" },
      { category: "dining", caption: "Traditional Ayurveda Sanctuary", alt: "Ayurveda Wellness Spa", src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80" }
    ]
  },

  // ---------- Policies page (linked from the footer when enabled) ----------
  // DEMO text: replace with the resort's REAL policies. Do not publish refund terms the owner has not agreed to.
  policies: {
    enabled: true,
    sections: [
      { title: "Booking & Payment", items: [
        "Enquiries and bookings are handled by the resort team on WhatsApp. Your stay is confirmed only when the resort confirms it.",
        "This website does not take payments. Payment terms are shared by the resort when you book."
      ] },
      { title: "Cancellation & Refunds", items: [
        "Cancellation and refund terms are shared by the resort at the time of booking. Please ask on WhatsApp before you pay."
      ] },
      { title: "House Rules", items: [
        "A valid photo ID is required for every guest at check-in.",
        "Please keep noise low after 10:00 PM so everyone can enjoy the quiet of the estate."
      ] },
      { title: "Privacy", items: [
        "This website does not collect or store your personal details.",
        "When you tap a WhatsApp button, the details you chose (dates, room, guests, any name you typed) are placed in a WhatsApp message to the resort. They are used only to reply to your enquiry."
      ] }
    ]
  },

  // ---------- Footer ----------
  footerLinks: [
    { label: "Rooms & Direct Tariffs", href: "rooms.html" },
    { label: "Photo Gallery", href: "gallery.html" },
    { label: "Honeymoon & Family Packages", href: "contact.html" },
    { label: "Route Map & Contact", href: "contact.html" }
  ],
  footerNote: "Direct Booking • Zero Commission"
};
