import { z } from 'zod';

export const PaymentCreateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  method: z.enum(['UPI', 'CARD', 'NET_BANKING', 'COD', 'BANK_TRANSFER']),
  amount: z.number().min(0, 'Amount must be positive'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  notes: z.string().optional(),
  updateOrderStatus: z.boolean().optional().default(false),
});

export const PaymentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
});
