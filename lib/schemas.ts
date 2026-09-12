import { z } from 'zod';

export const AddressSchema = z.object({
  fullName: z.string().min(2, 'Name is too short'),
  phone: z.string().min(10, 'Invalid phone number'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().min(6, 'Valid PIN code is required'),
  country: z.string().default('India'),
});

export const GSTInfoSchema = z.object({
  isRegistered: z.boolean(),
  gstin: z.string().optional(),
  legalName: z.string().optional(),
  gstAddress: AddressSchema.optional(),
});

export const CustomerInfoSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
});

export const CheckoutSchema = z.object({
  customerInfo: CustomerInfoSchema,
  purchaseType: z.enum(['PERSONAL', 'BUSINESS']),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  gstInfo: GSTInfoSchema.optional(),
  paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'COD', 'BANK_TRANSFER']),
});

export const EnquirySchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  message: z.string().min(10),
  productId: z.string().optional(),
});

export const ProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  sellingPrice: z.number().min(0),
  comparePrice: z.number().min(0).optional(),
  sku: z.string().min(2),
  stockQuantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  purchaseType: z.enum(['ENQUIRY_ONLY', 'BUY_ONLY', 'BUY_AND_ENQUIRE']),
  whatsappEnabled: z.boolean().optional(),
  material: z.string().optional(),
  stone: z.string().optional(),
  size: z.string().optional(),
  weight: z.string().optional(),
  origin: z.string().optional(),
  certification: z.string().optional(),
  primaryImage: z.object({ url: z.string().url(), altText: z.string().optional() }),
  gallery: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

