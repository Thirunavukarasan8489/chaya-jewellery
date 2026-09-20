/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seeds a demo jewellery catalogue (categories, products, variants), a
 * couple of extra hero banners, testimonials and FAQs — all placeholder
 * content — so the redesigned homepage has something real to render while
 * the store is still empty. Safe to re-run: every insert is guarded by a
 * lookup on a unique field, so nothing is duplicated.
 *
 * NOTE: testimonials and FAQs inserted here are DEMO content, not real
 * customer reviews — replace them via /admin before launch.
 */
const mongoose = require("mongoose");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const MONGODB_URI = process.env.MONGODB_URI;

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const CATEGORIES = [
  {
    slug: "rings",
    name: "Rings",
    variantType: "SIZE",
    description: "Solitaire, band and statement rings in 18K & 22K gold.",
  },
  {
    slug: "necklaces",
    name: "Necklaces",
    variantType: "WEIGHT",
    description: "Layered chains, chokers and bridal necklaces.",
  },
  {
    slug: "earrings",
    name: "Earrings",
    variantType: "NONE",
    description:
      "Chandbali, jhumka and stud earrings for everyday and occasion wear.",
  },
  {
    slug: "bracelets",
    name: "Bangles & Bracelets",
    variantType: "SIZE",
    description: "Everyday and statement bangles and bracelets.",
  },
  {
    slug: "pendants",
    name: "Pendants",
    variantType: "WEIGHT",
    description: "Gold and diamond pendants for daily and gifting occasions.",
  },
  {
    slug: "mangalsutra",
    name: "Mangalsutra",
    variantType: "WEIGHT",
    description: "Traditional and modern mangalsutra designs.",
  },
];

// price/comparePrice are in plain rupees (see CheckoutClient.tsx / lib/filters.ts
// convention — NOT paise, despite the stale comment on lib/types.ts Product.sellingPrice).
const PRODUCTS = {
  rings: [
    {
      name: "Aurelia Solitaire Ring",
      shortDescription: "18K gold solitaire ring.",
      price: 42999,
      comparePrice: 49999,
      featured: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 6,
    },
    {
      name: "Everleigh Diamond Band",
      shortDescription: "18K white gold diamond eternity band.",
      price: 68500,
      bestseller: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 4,
    },
    {
      name: "Meera Temple Ring",
      shortDescription: "22K gold temple-motif statement ring.",
      price: 35500,
      purchaseType: "BUY_ENQUIRE",
      stock: 8,
    },
  ],
  necklaces: [
    {
      name: "Anushka Layered Gold Necklace",
      shortDescription: "22K gold layered chain necklace.",
      price: 128500,
      featured: true,
      purchaseType: "ENQUIRE_ONLY",
      stock: 3,
    },
    {
      name: "Ivory Pearl Drop Necklace",
      shortDescription: "Freshwater pearl and gold necklace.",
      price: 24500,
      bestseller: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 10,
    },
    {
      name: "Rani Kundan Choker",
      shortDescription: "Kundan and pearl bridal choker.",
      price: 89500,
      purchaseType: "ENQUIRE_ONLY",
      stock: 3,
    },
  ],
  earrings: [
    {
      name: "Chandbali Gold Earrings",
      shortDescription: "22K gold chandbali earrings.",
      price: 32500,
      bestseller: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 9,
    },
    {
      name: "Meenakari Jhumka",
      shortDescription: "Enamel-work jhumka earrings.",
      price: 21500,
      featured: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 12,
    },
    {
      name: "Solitaire Diamond Studs",
      shortDescription: "18K gold diamond stud earrings.",
      price: 45500,
      purchaseType: "BUY_ONLY",
      stock: 7,
    },
  ],
  bracelets: [
    {
      name: "Kalyani Gold Bangle Set",
      shortDescription: "Set of two 22K gold bangles.",
      price: 156500,
      featured: true,
      purchaseType: "ENQUIRE_ONLY",
      stock: 2,
    },
    {
      name: "Estela Diamond Tennis Bracelet",
      shortDescription: "18K gold diamond tennis bracelet.",
      price: 98500,
      bestseller: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 4,
    },
    {
      name: "Everyday Gold Bracelet",
      shortDescription: "Lightweight 18K gold bracelet for daily wear.",
      price: 28500,
      purchaseType: "BUY_ONLY",
      stock: 14,
    },
  ],
  pendants: [
    {
      name: "Ananya Solitaire Pendant",
      shortDescription: "18K gold pendant with a solitaire stone.",
      price: 38500,
      bestseller: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 8,
    },
    {
      name: "Om Gold Pendant",
      shortDescription: "22K gold pendant.",
      price: 18500,
      purchaseType: "BUY_ONLY",
      stock: 15,
    },
    {
      name: "Infinity Diamond Pendant",
      shortDescription: "18K white gold diamond pendant.",
      price: 33500,
      featured: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 6,
    },
  ],
  mangalsutra: [
    {
      name: "Vivaha Classic Mangalsutra",
      shortDescription: "Traditional black bead and gold mangalsutra.",
      price: 45500,
      bestseller: true,
      purchaseType: "BUY_ENQUIRE",
      stock: 9,
    },
    {
      name: "Sundari Diamond Mangalsutra",
      shortDescription: "18K gold mangalsutra with a diamond pendant.",
      price: 72500,
      featured: true,
      purchaseType: "ENQUIRE_ONLY",
      stock: 4,
    },
    {
      name: "Everyday Mangalsutra Chain",
      shortDescription: "Lightweight daily-wear mangalsutra chain.",
      price: 26500,
      purchaseType: "BUY_ONLY",
      stock: 11,
    },
  ],
};

const HERO_EXTRA = [
  {
    name: "New Collection Banner",
    badge: "New Collection",
    title: "Timeless Gold, Modern Craft",
    subtitle:
      "Handcrafted rings, necklaces and bangles in 18K & 22K gold — designed for everyday elegance and bridal occasions alike.",
    ctaText: "Shop New Arrivals",
    ctaHref: "/products",
    secondaryCtaText: "Book a Consultation",
    secondaryCtaHref: "/contact",
    displayOrder: 1,
  },
  {
    name: "Bridal Edit Banner",
    badge: "Bridal Edit",
    title: "Jewellery for Your Big Day",
    subtitle:
      "From kundan chokers to diamond bangles — pieces made to become heirlooms.",
    ctaText: "Explore Bridal Edit",
    ctaHref: "/products?category=necklaces",
    secondaryCtaText: "Talk to an Expert",
    secondaryCtaHref: "/contact",
    displayOrder: 2,
  },
];

// Placeholder reviews — replace with real customer testimonials via /admin.
const TESTIMONIALS = [
  {
    customerName: "Ananya R.",
    location: "Chennai",
    quote:
      "The gold bangle set exceeded expectations — the finish is flawless and it arrived beautifully packaged.",
    rating: 5,
    displayOrder: 0,
  },
  {
    customerName: "Priya K.",
    location: "Bengaluru",
    quote:
      "Ordered a pendant for my mother's birthday. The consultation over WhatsApp made choosing so easy.",
    rating: 5,
    displayOrder: 1,
  },
  {
    customerName: "Meera S.",
    location: "Hyderabad",
    quote:
      "Beautiful craftsmanship on my mangalsutra. Exactly what I was looking for, and it arrived insured and on time.",
    rating: 5,
    displayOrder: 2,
  },
  {
    customerName: "Divya N.",
    location: "Mumbai",
    quote:
      "The earrings are lightweight and elegant — perfect for everyday wear. Will be shopping again.",
    rating: 4,
    displayOrder: 3,
  },
  {
    customerName: "Kavya T.",
    location: "Coimbatore",
    quote:
      "Loved the bridal choker. The team was patient with all my questions before I placed the order.",
    rating: 5,
    displayOrder: 4,
  },
];

const FAQS = [
  {
    question: "Is your gold jewellery hallmarked?",
    answer:
      "Yes — every gold piece is BIS hallmarked, certifying purity, and ships with a certificate of authenticity.",
    displayOrder: 0,
  },
  {
    question: "Do you offer a size exchange if a ring or bangle doesn't fit?",
    answer:
      "Yes, we offer a free one-time resize or exchange within 15 days of delivery, as long as the piece is unworn and in its original packaging.",
    displayOrder: 1,
  },
  {
    question: "Can I customise a piece — engraving, stone or size?",
    answer:
      "Most rings, pendants and bangles can be customised. Message us on WhatsApp or use the enquiry form with your requirements and we'll confirm feasibility and pricing.",
    displayOrder: 2,
  },
  {
    question: "How is my order shipped?",
    answer:
      "Every order ships fully insured with signature-on-delivery, and you'll receive tracking details as soon as it's dispatched.",
    displayOrder: 3,
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept UPI, cards, net banking and bank transfer at checkout, plus cash on delivery for eligible orders.",
    displayOrder: 4,
  },
  {
    question: "Do you offer a lifetime exchange program?",
    answer:
      "Yes — Chaya Jewellery pieces are eligible for lifetime value-based exchange; ask our team for current terms.",
    displayOrder: 5,
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
  const db = mongoose.connection;
  const Categories = db.collection("categories");
  const Products = db.collection("products");
  const Variants = db.collection("productvariants");
  const Hero = db.collection("herosections");
  const Testimonials = db.collection("testimonials");
  const Faqs = db.collection("faqs");

  // Hide the leftover "Gemstone" category from the old business model —
  // reversible (DRAFT, not deleted), just stops it showing in Shop by Category.
  const hidden = await Categories.updateOne(
    { slug: "gemstone" },
    { $set: { status: "DRAFT" } },
  );
  if (hidden.matchedCount)
    console.log('Hid legacy "gemstone" category (set to DRAFT).');

  const categoryIds = {};
  for (const cat of CATEGORIES) {
    const existing = await Categories.findOne({ slug: cat.slug });
    if (existing) {
      categoryIds[cat.slug] = existing._id;
      continue;
    }
    const now = new Date();
    const res = await Categories.insertOne({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      status: "ACTIVE",
      variantType: cat.variantType,
      calculatePriceOnVariantValue: false,
      createdAt: now,
      updatedAt: now,
    });
    categoryIds[cat.slug] = res.insertedId;
    console.log("Created category:", cat.name);
  }

  let dayOffset = 0;
  for (const [catSlug, items] of Object.entries(PRODUCTS)) {
    for (const item of items) {
      const slug = slugify(item.name);
      const existing = await Products.findOne({ slug });
      if (existing) {
        dayOffset += 1;
        continue;
      }
      const createdAt = new Date(Date.now() - dayOffset * 86400000);
      dayOffset += 1;

      const productRes = await Products.insertOne({
        name: item.name,
        slug,
        category: categoryIds[catSlug],
        shortDescription: item.shortDescription,
        description: item.shortDescription,
        hasVariants: false,
        reservedQuantity: 0,
        stockStatus: item.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        status: "ACTIVE",
        purchaseType: item.purchaseType,
        whatsappEnabled: true,
        featured: !!item.featured,
        bestseller: !!item.bestseller,
        createdAt,
        updatedAt: createdAt,
      });

      await Variants.insertOne({
        productId: productRes.insertedId,
        categoryId: categoryIds[catSlug],
        name: "Default",
        price: item.price,
        comparePrice: item.comparePrice,
        stock: item.stock,
        reservedQuantity: 0,
        lowStockThreshold: 3,
        purchaseType: item.purchaseType,
        whatsappEnabled: true,
        createdAt,
        updatedAt: createdAt,
      });
      console.log("Created product:", item.name);
    }
  }

  // Polish the existing "test" hero banner in place (same doc/image/links —
  // just replacing obvious placeholder copy) rather than deleting real data.
  const testBanner = await Hero.findOne({ title: "test" });
  if (testBanner) {
    await Hero.updateOne(
      { _id: testBanner._id },
      {
        $set: {
          badge: "Chaya Jewellery",
          title: "Fine Jewellery, Finely Made",
          subtitle:
            "Handcrafted gold and diamond jewellery — certified, insured and delivered with care.",
          ctaText: "Shop the Collection",
          secondaryCtaText: "Book a Consultation",
        },
      },
    );
    console.log('Polished the existing "test" hero banner copy.');
  }

  for (const h of HERO_EXTRA) {
    const existing = await Hero.findOne({ title: h.title });
    if (existing) continue;
    const now = new Date();
    await Hero.insertOne({
      ...h,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log("Created hero banner:", h.title);
  }

  for (const t of TESTIMONIALS) {
    const existing = await Testimonials.findOne({
      customerName: t.customerName,
      quote: t.quote,
    });
    if (existing) continue;
    const now = new Date();
    await Testimonials.insertOne({
      ...t,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("Seeded testimonials (demo content).");

  for (const f of FAQS) {
    const existing = await Faqs.findOne({ question: f.question });
    if (existing) continue;
    const now = new Date();
    await Faqs.insertOne({
      ...f,
      category: "General",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log("Seeded FAQs.");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
