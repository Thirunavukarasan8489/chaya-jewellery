'use server';

import dbConnect from '@/lib/db';
import { Lead } from '@/lib/models/lead';
import { Product } from '@/lib/models/product';
import { Category } from '@/lib/models/category';
import { getSession } from '@/lib/auth';
import { LeadCreateSchema } from '@/lib/validations/lead.schema';
import { revalidatePath } from 'next/cache';

async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (!allowedRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

export async function getLeads(page = 1, limit = 50) {
  try {
    await checkAuth(['SUPER_ADMIN', 'LEAD_MANAGER']);
    await dbConnect();
    const skip = (page - 1) * limit;
    const leads = await Lead.find()
      .populate('product', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();
    
    const totalCount = await Lead.countDocuments();
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(leads)),
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createLead(data: any) {
  try {
    // No auth check for createLead because public visitors use this!
    
    const parsed = LeadCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();
    
    const lead = await Lead.create(validatedData);
    revalidatePath('/admin/leads');
    return { success: true, data: JSON.parse(JSON.stringify(lead)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLead(id: string, data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'LEAD_MANAGER']);
    
    // We can reuse LeadCreateSchema or allow partials for update
    const parsed = LeadCreateSchema.partial().safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();
    
    const lead = await Lead.findByIdAndUpdate(id, validatedData, { new: true }).lean();
    revalidatePath('/admin/leads');
    revalidatePath(`/admin/leads/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(lead)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addLeadNote(id: string, content: string) {
  try {
    const session = await checkAuth(['SUPER_ADMIN', 'LEAD_MANAGER']);
    await dbConnect();
    
    const lead = await Lead.findById(id);
    if (!lead) throw new Error('Lead not found');
    
    lead.notes.push({
      content,
      addedBy: session.userId,
      createdAt: new Date(),
    });
    
    await lead.save();
    revalidatePath(`/admin/leads/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(lead)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateLeadStatus(id: string, status: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'LEAD_MANAGER']);
    await dbConnect();
    
    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true }).lean();
    revalidatePath('/admin/leads');
    revalidatePath(`/admin/leads/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(lead)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLead(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'LEAD_MANAGER']);
    await dbConnect();
    
    await Lead.findByIdAndDelete(id);
    revalidatePath('/admin/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
