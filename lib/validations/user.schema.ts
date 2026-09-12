import { z } from 'zod';

export const AdminUserCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']),
  screenPermissions: z.array(z.string()).optional().default([]),
});

export const AdminUserUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']).optional(),
  screenPermissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});
