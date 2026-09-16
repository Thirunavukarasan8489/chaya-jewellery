import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Human-readable label for a Category's `variantType`, shared between the admin variant form and the server-side variant name/SKU generation so they stay in sync. */
export const VARIANT_TYPE_LABELS: Record<string, string> = {
  CARAT: "Carat",
  SIZE: "Size",
  WEIGHT: "Weight",
  NONE: "Variant Value",
};

export function variantTypeLabel(variantType?: string) {
  return VARIANT_TYPE_LABELS[variantType || "NONE"] || "Variant Value";
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format Rupee amounts nicely with Indian numbering system (e.g. ₹3,27,500). */
export function formatINR(amount: number) {
  if (!amount && amount !== 0) return "₹0";
  return inr.format(amount);
}

export function discountPercent(sellingPaise: number, comparePaise?: number) {
  if (!comparePaise || comparePaise <= sellingPaise) return null;
  return Math.round(((comparePaise - sellingPaise) / comparePaise) * 100);
}

/**
 * Deterministic placeholder colour for GemImage when a product/category has
 * no `gemColor` set (the field isn't on the current Category/Product schema,
 * so this is always the case for anything entered via the admin today).
 * Hashing the slug keeps a given item's placeholder stable across renders
 * instead of every card falling back to the same flat colour.
 */
const JEWEL_TONE_PALETTE = [
  "#6E3C75", // light plum
  "#D9A441", // champagne gold
  "#4A0B52", // royal plum
  "#C81E4A", // ruby
  "#0F9C68", // emerald
  "#1F4FD8", // sapphire
  "#E0A713", // amber/topaz
  "#98732E", // dark gold
];

export function gemColorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return JEWEL_TONE_PALETTE[hash % JEWEL_TONE_PALETTE.length];
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function flattenVariants(products: Product[]): Product[] {
  const flattened: Product[] = [];
  
  for (const product of products) {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      for (let i = 0; i < product.variants.length; i++) {
        const variant = product.variants[i];
        
        // Skip variants with 0 stock unless we explicitly want to show out of stock
        // Wait, normally we show all products, just marked as "Sold Out"
        
        const variantProduct: Product = {
          ...product,
          id: product.id, // keep the same base product id for cart
          slug: variant.slug || `${product.slug}-${slugify(variant.name)}`,
          name: `${product.name} - ${variant.name}`,
          sellingPrice: variant.price,
          comparePrice: variant.comparePrice,
          stockQuantity: variant.stock,
          reservedQuantity: variant.reservedQuantity || 0,
          lowStockThreshold: variant.lowStockThreshold || product.lowStockThreshold,
          primaryImage: variant.primaryImage?.url ? variant.primaryImage : product.primaryImage,
          selectedVariantName: variant.name,
          // Keep the variant on the flattened product (instead of discarding
          // it via hasVariants: false) so the purchase flow still knows the
          // variant's id/sku — otherwise Add to Cart can't reserve inventory
          // for products reached directly via a variant-specific slug.
          hasVariants: true,
          variants: [variant],
        };
        flattened.push(variantProduct);
      }
    } else {
      flattened.push(product);
    }
  }
  
  return flattened;
}

/**
 * Category names are stored "English / Sanskrit" (e.g. "Ruby / Manik"). Buyers
 * in this market search the Sanskrit/rashi-ratna term as often as the English
 * one, so decorative labels (chips, cards, nav) lead with it while functional
 * wayfinding (breadcrumbs, page titles) keeps the full string.
 */
export function categoryTerms(name: string) {
  const [english, sanskrit] = name.split(" / ");
  return sanskrit
    ? { primary: sanskrit, secondary: english }
    : { primary: english, secondary: null as string | null };
}

export function whatsappLink(businessData: any, message: string) {
  const number = businessData?.whatsapp || "919840012345";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const NAV_DATA = {
  primaryNav: [
    { label: "ALL PRODUCTS", href: "/products" },
    { label: "ABOUT", href: "/about" },
    { label: "CONTACT", href: "/contact" },
  ],
  secondaryNav: [
    { label: "FAQs", href: "/faqs" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Track Order", href: "/track-order" },
  ],
  business: {
    phone: "+91 98400 12345",
    phoneHref: "tel:+919840012345",
    whatsapp: "919840012345",
    email: "hello@chayajewellery.in",
    address: "12, Radha Krishnan Salai, Mylapore, Chennai 600004",
    hours: "Mon–Sat, 10:00 – 19:00 IST",
  },
};
