import { z } from 'zod';

export const UpdateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'FOLLOW_UP', 'QUALIFIED', 'CONVERTED', 'CLOSED', 'SPAM']),
});

export const AddLeadNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export const SendLeadEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});
