'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models/lead';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/services/email';
import { UpdateLeadStatusSchema, AddLeadNoteSchema, SendLeadEmailSchema } from '@/lib/validations/admin-leads';

const requireLeadManager = async () => {
  const session = await getSession();
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'LEAD_MANAGER')) {
    throw new Error('Unauthorized');
  }
  return session;
};

export async function getLeads(filters: Record<string, unknown> = {}, page = 1, limit = 10) {
  try {
    await requireLeadManager();
    await dbConnect();
    
    const skip = (page - 1) * limit;
    
    const [leads, total] = await Promise.all([
      Lead.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Lead.countDocuments(filters)
    ]);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(leads)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error: unknown) {
    console.error('Error fetching leads:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getLeadById(id: string) {
  try {
    await requireLeadManager();
    await dbConnect();
    
    const lead = await Lead.findById(id).lean();
    if (!lead) throw new Error('Lead not found');

    return { success: true, data: JSON.parse(JSON.stringify(lead)) };
  } catch (error: unknown) {
    console.error('Error fetching lead:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    await requireLeadManager();
    const parsed = UpdateLeadStatusSchema.parse({ status });
    
    await dbConnect();
    const lead = await Lead.findByIdAndUpdate(id, { status: parsed.status }, { new: true });
    
    if (!lead) throw new Error('Lead not found');
    
    revalidatePath(`/admin/leads`);
    revalidatePath(`/admin/leads/${id}`);
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating lead status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function addLeadNote(id: string, content: string) {
  try {
    const session = await requireLeadManager();
    const parsed = AddLeadNoteSchema.parse({ content });
    
    await dbConnect();
    const lead = await Lead.findById(id);
    if (!lead) throw new Error('Lead not found');
    
    lead.notes.push({
      content: parsed.content,
      addedBy: session.userId,
      createdAt: new Date()
    });
    
    await lead.save();
    
    revalidatePath(`/admin/leads/${id}`);
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Error adding lead note:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendLeadEmail(id: string, subject: string, message: string) {
  try {
    const session = await requireLeadManager();
    const parsed = SendLeadEmailSchema.parse({ subject, message });
    
    await dbConnect();
    const lead = await Lead.findById(id);
    if (!lead) throw new Error('Lead not found');
    if (!lead.email) throw new Error('Lead does not have an email address');
    
    // Send email using nodemailer service
    await sendEmail({
      to: lead.email,
      subject: parsed.subject,
      html: parsed.message
    });
    
    // Log in timeline
    lead.notes.push({
      content: `Email Sent: ${parsed.subject}`,
      addedBy: session.userId,
      createdAt: new Date()
    });
    
    // Update status to CONTACTED if it's currently NEW
    if (lead.status === 'NEW') {
      lead.status = 'CONTACTED';
    }
    
    await lead.save();
    
    revalidatePath(`/admin/leads/${id}`);
    revalidatePath(`/admin/leads`);
    
    return { success: true };
  } catch (error: unknown) {
    console.error('Error sending lead email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
