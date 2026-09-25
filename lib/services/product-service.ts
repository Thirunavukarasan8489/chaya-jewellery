import dbConnect from "@/lib/db";
import { Product } from "@/lib/models/product";
import { Inventory } from "@/lib/models/inventory";
import { Category } from "@/lib/models/category";
import type { Product as PublicProduct } from "@/lib/types";
import { gemColorFor } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import { unstable_cache } from "next/cache";
async function attachInventory(docs: any[]): Promise<any[]> {
  if (docs.length === 0) return docs;
  const inventories = await Inventory.find({
    productId: { $in: docs.map((d) => d._id) },
  }).lean();
  const byProduct = new Map<string, any>();
  for (const inv of inventories) {
    byProduct.set(inv.productId.toString(), inv);
  }
  return docs.map((d) => ({
    ...d,
    inventory: byProduct.get(d._id.toString()) || null,
  }));
}

// Prevent Turbopack from tree-shaking the models
if (!Category) console.warn("Category model not loaded");

function mapToPublicProduct(doc: any): PublicProduct {
  const categoryColor =
    doc.category?.gemColor || gemColorFor(doc.category?.slug || doc.slug);

  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    categorySlug: doc.category?.slug || "",
    shortDescription: sanitizeRichText(doc.shortDescription),
    description: sanitizeRichText(doc.description),
    sellingPrice: doc.price || doc.sellingPrice || 0,
    comparePrice: doc.comparePrice,
    sku: doc.productCode || doc.sku || `SKU-${doc._id.toString().substring(0, 6)}`,
    stockQuantity: doc.inventory?.availableStock || 0,
    reservedQuantity: doc.inventory?.reservedStock || 0,
    lowStockThreshold: doc.inventory?.lowStockThreshold || 5,
    purchaseType:
      doc.purchaseType === "ENQUIRE_ONLY"
        ? "ENQUIRY_ONLY"
        : doc.purchaseType === "BUY_ENQUIRE"
          ? "BUY_AND_ENQUIRE"
          : "BUY_ONLY",
    enquiryEnabled: doc.purchaseType !== "BUY_ONLY",
    whatsappEnabled: doc.whatsappEnabled ?? true,
    gemColor: doc.gemColor || categoryColor,
    gallery: doc.gallery?.length || 0,
    primaryImage: doc.primaryImage?.url?.trim()
      ? { url: doc.primaryImage.url, altText: doc.primaryImage.altText }
      : undefined,
    images:
      doc.gallery
        ?.filter((g: any) => g.url?.trim())
        .map((g: any) => ({ url: g.url, altText: g.altText })) || [],
    seo: {
      metaTitle: doc.metaTitle,
      metaDescription: doc.metaDescription,
      keywords: doc.keywords,
      ogImage: doc.ogImage,
    },
    featured: doc.featured || false,
    bestseller: doc.bestseller || false,
    rating: doc.rating || 5,
    reviewCount: doc.reviewCount || 0,
    published: doc.status === "ACTIVE" || doc.published !== false,
  };
}

export const getProducts = unstable_cache(
  async () => {
    try {
      await dbConnect();
      let docs = await Product.find({ status: "ACTIVE" })
        .populate("category")
        .lean();
      if (!docs || docs.length === 0) {
        docs = await Product.find({}).populate("category").lean();
      }
      if (docs && docs.length > 0) {
        const withInventory = await attachInventory(docs);
        return withInventory.map(mapToPublicProduct);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    return [];
  },
  ["public-products-v6"],
  { revalidate: 60, tags: ["products"] },
);

export const getProductBySlug = unstable_cache(
  async (slug: string) => {
    try {
      await dbConnect();
      let doc = await Product.findOne({ status: "ACTIVE", slug })
        .populate("category")
        .lean();
      if (!doc) {
        doc = await Product.findOne({ slug }).populate("category").lean();
      }

      if (doc) {
        const [withInventory] = await attachInventory([doc]);
        return mapToPublicProduct(withInventory);
      }
    } catch (error) {
      console.error("Error fetching product by slug:", error);
    }
    return null;
  },
  ["public-product-by-slug-v6"],
  { revalidate: 60, tags: ["products"] },
);

export const getProductsByCategory = unstable_cache(
  async (categorySlug: string) => {
    const allProducts = await getProducts();
    const matched = allProducts.filter((p: PublicProduct) => p.categorySlug === categorySlug);
    return matched.length > 0 ? matched : allProducts.slice(0, 4);
  },
  ["public-products-by-category-v6"],
  { revalidate: 60, tags: ["products"] },
);

export const getFeaturedProducts = unstable_cache(
  async () => {
    const allProducts = await getProducts();
    const featured = allProducts.filter((p: PublicProduct) => p.featured);
    return featured.length > 0 ? featured : allProducts;
  },
  ["public-products-featured-v6"],
  { revalidate: 60, tags: ["products"] },
);

export const getBestsellers = unstable_cache(
  async () => {
    const allProducts = await getProducts();
    const bestsellers = allProducts.filter((p: PublicProduct) => p.bestseller);
    return bestsellers.length > 0 ? bestsellers : allProducts;
  },
  ["public-products-bestsellers-v6"],
  { revalidate: 60, tags: ["products"] },
);

export const getNewArrivals = unstable_cache(
  async () => {
    try {
      await dbConnect();
      let docs = await Product.find({ status: "ACTIVE" })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate("category")
        .lean();
      if (!docs || docs.length === 0) {
        docs = await Product.find({})
          .sort({ createdAt: -1 })
          .limit(12)
          .populate("category")
          .lean();
      }
      if (docs && docs.length > 0) {
        const withInventory = await attachInventory(docs);
        return withInventory.map(mapToPublicProduct);
      }
    } catch (error) {
      console.error("Error fetching new arrivals:", error);
    }
    return [];
  },
  ["public-products-new-arrivals-v6"],
  { revalidate: 60, tags: ["products"] },
);

export const getRelatedProducts = unstable_cache(
  async (productId: string, categorySlug: string, limit = 6) => {
    const allProducts = await getProducts();
    const sameCategory = allProducts.filter(
      (p: PublicProduct) => p.id !== productId && p.categorySlug === categorySlug,
    );
    const others = allProducts.filter(
      (p: PublicProduct) => p.id !== productId && p.categorySlug !== categorySlug,
    );
    return sameCategory.concat(others).slice(0, limit);
  },
  ["public-products-related-v6"],
  { revalidate: 60, tags: ["products"] },
);
