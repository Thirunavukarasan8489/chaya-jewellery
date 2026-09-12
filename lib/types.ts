/**
 * Domain types for the Chaya Jewellery catalogue.
 *
 * These mirror the fields in the spec (§9 Purchase Type, §24 Product Admin
 * Fields, §25 Category Flow) so that swapping the mock data layer for MongoDB
 * later is a change of source, not a change of shape.
 */

export type PurchaseType = "ENQUIRY_ONLY" | "BUY_ONLY" | "BUY_AND_ENQUIRE";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Hue anchor used to render the placeholder gem artwork. */
  gemColor: string;
  image?: string;
  displayOrder: number;
  published: boolean;
  calculatePriceOnVariantValue?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  caratApprox?: number;
  variantValue?: number;
  size?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  image?: { url: string; altText?: string };
  primaryImage?: { url: string; altText?: string };
  gallery?: { url: string; altText?: string }[];
}

export interface ProductSeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  shortDescription: string;
  description: string;

  /** Money in paise. */
  sellingPrice: number;
  comparePrice?: number;

  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;

  purchaseType: PurchaseType;
  enquiryEnabled: boolean;
  whatsappEnabled: boolean;

  /** Hue anchor for the placeholder artwork until real media is uploaded. */
  gemColor: string;
  gallery: number;
  primaryImage?: { url: string; altText?: string };
  images?: { url: string; altText?: string }[];

  hasVariants: boolean;
  variants?: ProductVariant[];

  seo?: ProductSeo;

  featured: boolean;
  bestseller: boolean;
  rating: number;
  reviewCount: number;
  published: boolean;
  
  selectedVariantName?: string;
}

/** §13 Inventory Flow: available = stock - reserved */
export function availableQuantity(product: Product) {
  return Math.max(0, product.stockQuantity - product.reservedQuantity);
}

export function stockStatus(product: Product): StockStatus {
  const available = availableQuantity(product);
  if (available <= 0) return "OUT_OF_STOCK";
  if (available <= product.lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

export function canBuy(product: Product) {
  return (
    product.purchaseType === "BUY_ONLY" ||
    product.purchaseType === "BUY_AND_ENQUIRE"
  );
}

export function canEnquire(product: Product) {
  return (
    product.purchaseType === "ENQUIRY_ONLY" ||
    product.purchaseType === "BUY_AND_ENQUIRE"
  );
}

export interface CartLine {
  productId: string;
  variantId?: string;
  sku?: string;
  slug: string;
  name: string;
  image?: string;
  gemColor: string;
  /** Price snapshot at the time the line was added (§11.1). */
  unitPrice: number;
  quantity: number;
  variantName?: string;
  variantValue?: number;
  calculatePriceOnVariantValue?: boolean;
}

export interface LeadNote {
  _id?: string;
  content: string;
  addedBy?: string;
  createdAt: string | Date;
}

export interface LeadType {
  _id: string;
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location?: string;
  product?: Partial<Product>;
  category?: Partial<Category>;
  message: string;
  source: string;
  status:
    | "NEW"
    | "CONTACTED"
    | "FOLLOW_UP"
    | "QUALIFIED"
    | "CONVERTED"
    | "CLOSED"
    | "SPAM";
  assignedTo?: string;
  notes?: LeadNote[];
  followUpDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}
