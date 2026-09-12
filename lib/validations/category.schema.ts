import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT']).default('DRAFT'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  variantType: z.enum(['CARAT', 'SIZE', 'WEIGHT', 'NONE']).default('NONE'),
  calculatePriceOnVariantValue: z.boolean().default(false),
});

export type CategoryInput = z.infer<typeof CategorySchema>;
