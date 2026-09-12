import { canBuy, canEnquire, stockStatus, type Product } from "@/lib/types";

/** Buckets in paise. Chosen around the natural price tiers of the catalogue. */
export const priceBands = [
  { value: "under-25k", label: "Under ₹25,000", min: 0, max: 2_500_000 },
  { value: "25k-1l", label: "₹25,000 – ₹1L", min: 2_500_000, max: 10_000_000 },
  { value: "1l-5l", label: "₹1L – ₹5L", min: 10_000_000, max: 50_000_000 },
  { value: "above-5l", label: "Above ₹5L", min: 50_000_000, max: Infinity },
] as const;

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
] as const;

export const purchaseOptions = [
  { value: "buy", label: "Available to buy" },
  { value: "enquiry", label: "By enquiry" },
] as const;

export type ProductQuery = {
  q?: string;
  category?: string;
  price?: string;
  availability?: string;
  purchase?: string;
  sort?: string;
};

/** Normalises Next's `string | string[] | undefined` search params. */
export function toQuery(
  raw: Record<string, string | string[] | undefined>,
): ProductQuery {
  const pick = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    q: pick("q"),
    category: pick("category"),
    price: pick("price"),
    availability: pick("availability"),
    purchase: pick("purchase"),
    sort: pick("sort"),
  };
}

export function applyFilters(source: Product[], query: ProductQuery) {
  let result = source.filter((p) => p.published);

  if (query.q) {
    const needle = query.q.trim().toLowerCase();
    result = result.filter((p) =>
      [p.name, p.shortDescription, p.sku, p.categorySlug]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle)),
    );
  }

  if (query.category) {
    const wanted = new Set(query.category.split(","));
    result = result.filter((p) => wanted.has(p.categorySlug));
  }

  if (query.price) {
    const band = priceBands.find((b) => b.value === query.price);
    if (band) {
      result = result.filter(
        (p) => p.sellingPrice >= band.min && p.sellingPrice < band.max,
      );
    }
  }

  if (query.availability === "in-stock") {
    result = result.filter((p) => stockStatus(p) !== "OUT_OF_STOCK");
  }

  if (query.purchase === "buy") result = result.filter(canBuy);
  if (query.purchase === "enquiry") result = result.filter(canEnquire);

  switch (query.sort) {
    case "price-asc":
      result = [...result].sort((a, b) => a.sellingPrice - b.sellingPrice);
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.sellingPrice - a.sellingPrice);
      break;
    case "popular":
      result = [...result].sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "rating":
      result = [...result].sort((a, b) => b.rating - a.rating);
      break;
    default:
      result = [...result].sort(
        (a, b) => Number(b.featured) - Number(a.featured),
      );
  }

  return result;
}

export function activeFilterCount(query: ProductQuery) {
  return [query.category, query.price, query.availability, query.purchase].filter(
    Boolean,
  ).length;
}
