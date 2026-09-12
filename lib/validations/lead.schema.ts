import { z } from 'zod';

export const LeadCreateSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  phone: z.string().min(5, 'Valid phone number is required'),
  whatsapp: z.string().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  location: z.string().optional(),
  
  product: z.string().optional(),
  category: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  source: z.string().default('Website'),
});
