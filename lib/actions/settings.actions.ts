'use server';

import dbConnect from '@/lib/db';
import { Settings } from '@/lib/models/settings';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Helper to check auth
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const normRoles = allowedRoles.map((r: string) => r.replace(' ', '_').toUpperCase());
  if (!normRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

export async function getSettings() {
  try {
    await dbConnect();
    let settings = await Settings.findOne().lean();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
      settings = settings.toObject();
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(settings)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSettings(data: any) {
  try {
    await checkAuth(['SUPER_ADMIN']); // Only Super Admin can change global settings
    await dbConnect();
    
    // We only have one settings document
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(data);
    } else {
      settings = await Settings.findOneAndUpdate({}, data, { new: true }).lean();
    }
    
    // Revalidate paths that might rely on global settings
    revalidatePath('/', 'layout');
    
    return { success: true, data: JSON.parse(JSON.stringify(settings)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
