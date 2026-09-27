import { z } from "zod";

export const ImageSchema = z.object({
  url: z.string().optional(),
  altText: z.string().optional(),
});

const RequiredImageSchema = z.object({
  url: z.string().min(1, "Image is required"),
  altText: z.string().optional(),
});

export const DiscountRuleSchema = z
  .object({
    minQty: z.coerce.number().min(1, "Min quantity must be at least 1"),
    maxQty: z.coerce.number().min(1, "Max quantity must be at least 1"),
    discountPercentage: z.coerce
      .number()
      .min(0)
      .max(100, "Discount cannot exceed 100%"),
  })
  .refine((data) => data.maxQty >= data.minQty, {
    message: "Max quantity must be greater than or equal to min quantity",
    path: ["maxQty"],
  });

export const ProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  baseSku: z.string().optional(),
  productCode: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  subCategory: z.string().optional(),
  subCategoryId: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),

  discountRules: z.array(DiscountRuleSchema).optional(),

  price: z.coerce.number().min(0, "Selling Price is required"),
  grossWeight: z.coerce.number().optional(),
  netWeight: z.coerce.number().optional(),
  stoneWeight: z.coerce.number().optional(),
  priceCode: z.string().optional(),

  specifications: z
    .object({
      material: z.string().optional(),
      purity: z.string().optional(),
      colour: z.string().optional(),
      style: z.string().optional(),
      occasion: z.string().optional(),
      stoneType: z.string().optional(),
      stoneColour: z.string().optional(),
      collectionName: z.string().optional(),
    })
    .optional(),

  reservedQuantity: z.coerce.number().int().min(0).default(0),
  stockStatus: z
    .enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"])
    .default("IN_STOCK"),
  status: z.enum(["ACTIVE", "DRAFT"]).default("DRAFT"),

  purchaseType: z.enum(["ENQUIRE_ONLY", "BUY_ONLY", "BUY_ENQUIRE"]),
  whatsappEnabled: z.boolean().default(false),

  primaryImage: RequiredImageSchema,
  gallery: z
    .array(RequiredImageSchema)
    .min(1, "At least one gallery image is required"),

  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().optional(),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
