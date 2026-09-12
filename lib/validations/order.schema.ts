import { z } from 'zod';

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP Code is required'),
  country: z.string().default('India'),
});

export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
});

export const OrderCreateSchema = z.object({
  customerName: z.string().min(1, 'Customer Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  
  purchaseType: z.enum(['PERSONAL', 'BUSINESS']),
  
  isGstRegistered: z.boolean().default(false),
  gstin: z.string().optional(),
  legalName: z.string().optional(),
  
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  gstAddress: AddressSchema.optional(),
  
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  
  subtotal: z.number().min(0),
  shippingFee: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  
  paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING', 'COD', 'BANK_TRANSFER']),
  paymentStatus: z.enum(['PENDING', 'CONFIRMED', 'FAILED']).optional(),
  orderStatus: z.enum([
    'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'RETURNED'
  ]).optional(),
});

export const OrderUpdateSchema = z.object({
  orderStatus: z.enum([
    'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'RETURNED'
  ]).optional(),
  paymentStatus: z.enum(['PENDING', 'CONFIRMED', 'FAILED']).optional(),
});
