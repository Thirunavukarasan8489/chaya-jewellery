'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import { NewsletterSubscriber } from '@/lib/models/newsletter-subscriber';

const EmailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.').max(200);

export async function subscribeToNewsletter(email: string) {
  const parsed = EmailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Enter a valid email address.' };
  }

  try {
    await dbConnect();
    // Upsert so a repeat signup with the same email is a friendly no-op,
    // not a duplicate-key error surfaced to the visitor.
    await NewsletterSubscriber.updateOne(
      { email: parsed.data },
      { $setOnInsert: { email: parsed.data } },
      { upsert: true },
    );
    return { success: true };
  } catch (error) {
    console.error('subscribeToNewsletter error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
