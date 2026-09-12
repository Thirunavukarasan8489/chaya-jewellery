import dbConnect from '@/lib/db';
import { Product } from '@/lib/models/product';
import { ProductVariant } from '@/lib/models/product-variant';
import { Category } from '@/lib/models/category';
import type { Product as PublicProduct } from '@/lib/types';
import { unstable_cache } from 'next/cache';

async function attachVariants(docs: any[]): Promise<any[]> {
  if (docs.length === 0) return docs;
  const variants = await ProductVariant.find({ productId: { $in: docs.map((d) => d._id) } }).lean();
  const byProduct = new Map<string, any[]>();
  for (const v of variants) {
    const key = v.productId.toString();
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key)!.push(v);
  }
  return docs.map((d) => ({ ...d, variants: byProduct.get(d._id.toString()) || [] }));
}

// Prevent Turbopack from tree-shaking the models
if (!Category) console.warn("Category model not loaded");

function mapToPublicProduct(doc: any): PublicProduct {
  const defaultVariant = doc.variants?.[0] || {};
  const categoryColor = doc.category?.gemColor || '#000000';
  
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    categorySlug: doc.category?.slug || '',
    shortDescription: doc.shortDescription || '',
    description: doc.description || '',
    sellingPrice: defaultVariant.price || doc.sellingPrice || 0,
    comparePrice: defaultVariant.comparePrice || doc.comparePrice,
    sku: doc.sku || `SKU-${doc._id.toString().substring(0, 6)}`,
    stockQuantity: doc.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || doc.stockQuantity || 5,
    reservedQuantity: doc.reservedQuantity || 0,
    lowStockThreshold: defaultVariant.lowStockThreshold || 5,
    purchaseType: doc.purchaseType === 'ENQUIRE_ONLY' ? 'ENQUIRY_ONLY' : 
                  doc.purchaseType === 'BUY_ENQUIRE' ? 'BUY_AND_ENQUIRE' : 'BUY_ONLY',
    enquiryEnabled: doc.purchaseType !== 'BUY_ONLY',
    whatsappEnabled: doc.whatsappEnabled ?? true,
    gemColor: doc.gemColor || categoryColor,
    gallery: doc.gallery?.length || 0,
    primaryImage: doc.primaryImage?.url?.trim() ? { url: doc.primaryImage.url, altText: doc.primaryImage.altText } : undefined,
    images: doc.gallery?.filter((g: any) => g.url?.trim()).map((g: any) => ({ url: g.url, altText: g.altText })) || [],
    hasVariants: doc.hasVariants || false,
    variants: doc.variants?.map((v: any) => ({
      id: v._id?.toString(),
      name: v.name,
      slug: v.slug,
      sku: v.sku,
      caratApprox: v.caratApprox,
      variantValue: v.variantValue,
      size: v.size,
      price: v.price || 0,
      comparePrice: v.comparePrice,
      stock: v.stock || 0,
      reservedQuantity: v.reservedQuantity || 0,
      lowStockThreshold: v.lowStockThreshold || 5,
      primaryImage: v.primaryImage?.url?.trim() ? { url: v.primaryImage.url, altText: v.primaryImage.altText } : undefined,
      gallery: v.gallery?.filter((g: any) => g?.url?.trim()).map((g: any) => ({ url: g.url, altText: g.altText })) || [],
    })) || [],
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
    published: doc.status === 'ACTIVE' || doc.published !== false,
  };
}

export const getProducts = unstable_cache(async () => {
  try {
    await dbConnect();
    let docs = await Product.find({ status: 'ACTIVE' }).populate('category').lean();
    if (!docs || docs.length === 0) {
      docs = await Product.find({}).populate('category').lean();
    }
    if (docs && docs.length > 0) {
      const withVariants = await attachVariants(docs);
      return withVariants.map(mapToPublicProduct);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }
  return [];
}, ['public-products-v6'], { revalidate: 60, tags: ['products'] });

export const getProductBySlug = unstable_cache(async (slug: string) => {
  try {
    await dbConnect();
    let doc = await Product.findOne({ status: 'ACTIVE', slug }).populate('category').lean();
    if (!doc) {
      doc = await Product.findOne({ slug }).populate('category').lean();
    }

    // Not a base product slug — it may be a variant-specific slug instead.
    if (!doc) {
      const variant = await ProductVariant.findOne({ slug }).lean();
      if (variant) {
        doc = await Product.findOne({ _id: variant.productId, status: 'ACTIVE' }).populate('category').lean();
        if (!doc) {
          doc = await Product.findOne({ _id: variant.productId }).populate('category').lean();
        }
      }
    }

    if (doc) {
      const [withVariants] = await attachVariants([doc]);
      const publicProduct = mapToPublicProduct(withVariants);
      if (publicProduct.slug === slug || !publicProduct.hasVariants) {
        return publicProduct;
      } else {
        // It's a variant slug, so find it and return the flattened version
        const utils = await import('@/lib/utils');
        const flattened = utils.flattenVariants([publicProduct]);
        const found = flattened.find((p: any) => p.slug === slug);
        return found || publicProduct;
      }
    }
  } catch (error) {
    console.error("Error fetching product by slug:", error);
  }
  return null;
}, ['public-product-by-slug-v6'], { revalidate: 60, tags: ['products'] });

export const getProductsByCategory = unstable_cache(async (categorySlug: string) => {
  const allProducts = await getProducts();
  const matched = allProducts.filter(p => p.categorySlug === categorySlug);
  return matched.length > 0 ? matched : allProducts.slice(0, 4);
}, ['public-products-by-category-v6'], { revalidate: 60, tags: ['products'] });

export const getFeaturedProducts = unstable_cache(async () => {
  const allProducts = await getProducts();
  const featured = allProducts.filter(p => p.featured);
  return featured.length > 0 ? featured : allProducts;
}, ['public-products-featured-v6'], { revalidate: 60, tags: ['products'] });

export const getBestsellers = unstable_cache(async () => {
  const allProducts = await getProducts();
  const bestsellers = allProducts.filter(p => p.bestseller);
  return bestsellers.length > 0 ? bestsellers : allProducts;
}, ['public-products-bestsellers-v6'], { revalidate: 60, tags: ['products'] });

export const getRelatedProducts = unstable_cache(async (productId: string, categorySlug: string, limit = 6) => {
  const allProducts = await getProducts();
  const sameCategory = allProducts.filter(p => p.id !== productId && p.categorySlug === categorySlug);
  const others = allProducts.filter(p => p.id !== productId && p.categorySlug !== categorySlug);
  return sameCategory.concat(others).slice(0, limit);
}, ['public-products-related-v6'], { revalidate: 60, tags: ['products'] });
