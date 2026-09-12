'use server';

import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models/lead';
import { EnquirySchema } from '@/lib/schemas';

export async function createLeadAction(formData: FormData) {
  try {
    const data = {
      customerName: formData.get('customerName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      message: formData.get('message'),
      productId: formData.get('productId'),
    };

    // Validate using Zod
    const parsed = EnquirySchema.parse(data);

    await dbConnect();
    
    // Create new Lead
    const newLead = await Lead.create({
      customerName: parsed.customerName,
      phone: parsed.phone,
      email: parsed.email,
      message: parsed.message,
      product: parsed.productId,
      source: 'Website Form',
      status: 'NEW',
    });

    return { success: true, leadId: newLead._id.toString() };
  } catch (error: unknown) {
    console.error('Failed to create lead:', error);
    const message = error instanceof Error ? error.message : 'Validation failed';
    return { success: false, error: message };
  }
}
