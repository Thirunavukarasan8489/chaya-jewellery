'use server';

import dbConnect from '@/lib/db';
import { HeroSection } from '@/lib/models/hero-section';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to check auth
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const normRoles = allowedRoles.map(r => r.replace(' ', '_').toUpperCase());
  if (!normRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

export async function getHeroSections() {
  try {
    await dbConnect();
    const sections = await HeroSection.find().sort({ displayOrder: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(sections)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHeroSectionById(id: string) {
  try {
    await dbConnect();
    const section = await HeroSection.findById(id).lean();
    if (!section) return { success: false, error: 'Section not found' };
    return { success: true, data: JSON.parse(JSON.stringify(section)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createHeroSection(data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();
    
    // Auto-increment displayOrder if not provided or prevent duplicate
    if (data.displayOrder === undefined || data.displayOrder === null || data.displayOrder === '') {
      const lastSection = await HeroSection.findOne().sort({ displayOrder: -1 });
      data.displayOrder = lastSection ? lastSection.displayOrder + 1 : 0;
    } else {
      const existing = await HeroSection.findOne({ displayOrder: data.displayOrder });
      if (existing) {
        return { success: false, error: `Display order ${data.displayOrder} is already in use by another hero section.` };
      }
    }

    const section = await HeroSection.create(data);
    
    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    return { success: true, data: JSON.parse(JSON.stringify(section)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHeroSection(id: string, data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();
    
    if (data.displayOrder !== undefined && data.displayOrder !== null && data.displayOrder !== '') {
      const existing = await HeroSection.findOne({ displayOrder: data.displayOrder, _id: { $ne: id } });
      if (existing) {
        return { success: false, error: `Display order ${data.displayOrder} is already in use by another hero section.` };
      }
    }

    const section = await HeroSection.findByIdAndUpdate(id, data, { new: true }).lean();
    
    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    revalidatePath(`/admin/website/hero-section/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(section)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteHeroSection(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();
    
    await HeroSection.findByIdAndDelete(id);
    
    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleHeroSectionActive(id: string, isActive: boolean) {
  return updateHeroSection(id, { isActive });
}

export async function reorderHeroSections(updates: { id: string, displayOrder: number }[]) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    // Perform bulk write to update all displayOrders efficiently
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { displayOrder: update.displayOrder },
      },
    }));

    await HeroSection.bulkWrite(bulkOps);
    
    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
