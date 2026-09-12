import { z } from 'zod';

export const ImageSchema = z.object({
  url: z.string().optional(),
  altText: z.string().optional(),
});

export const VariantSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  sku: z.string().optional(),
  variantValue: z.coerce.number().optional(),
  caratApprox: z.coerce.number().optional(),
  size: z.string().optional(),
  price: z.coerce.number().min(0, 'Selling Price is required'),
  comparePrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  image: ImageSchema.optional(),
});

export const DiscountRuleSchema = z.object({
  minQty: z.coerce.number().min(1, 'Min quantity must be at least 1'),
  maxQty: z.coerce.number().min(1, 'Max quantity must be at least 1'),
  discountPercentage: z.coerce.number().min(0).max(100, 'Discount cannot exceed 100%'),
}).refine(data => data.maxQty >= data.minQty, {
  message: "Max quantity must be greater than or equal to min quantity",
  path: ["maxQty"],
});

export const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  baseSku: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  
  discountRules: z.array(DiscountRuleSchema).optional(),

  hasVariants: z.boolean().default(true),
  variants: z.array(VariantSchema).optional(),
  
  reservedQuantity: z.coerce.number().int().min(0).default(0),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).default('IN_STOCK'),
  status: z.enum(['ACTIVE', 'DRAFT']).default('DRAFT'),
  
  purchaseType: z.enum(['ENQUIRE_ONLY', 'BUY_ONLY', 'BUY_ENQUIRE']),
  whatsappEnabled: z.boolean().default(false),

  primaryImage: ImageSchema.optional(),
  gallery: z.array(ImageSchema).optional(),
  
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
