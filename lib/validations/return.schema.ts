import { z } from 'zod';

export const ReturnItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const ReturnCreateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  items: z.array(ReturnItemSchema).min(1, 'At least one item is required to return'),
  reason: z.string().min(5, 'Please provide a valid reason (min 5 chars)'),
});

export const ReturnProcessSchema = z.object({
  status: z.enum(['PENDING_INSPECTION', 'APPROVED', 'REJECTED', 'REFUNDED']),
  refundAmount: z.number().min(0, 'Refund amount must be non-negative'),
  adminNotes: z.string().optional(),
});
