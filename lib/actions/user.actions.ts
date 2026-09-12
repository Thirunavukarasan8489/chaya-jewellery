'use server';

import dbConnect from '@/lib/db';
import { User } from '@/lib/models/user';
import { getSession } from '@/lib/auth';
import { logAuditAction } from '@/lib/actions/audit';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { AdminUserCreateSchema, AdminUserUpdateSchema } from '@/lib/validations/user.schema';

async function checkSuperAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  if (session.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Only Super Admins can manage admin users');
  }
  return session;
}

export async function getAdminUsers() {
  try {
    await checkSuperAdmin();
    await dbConnect();
    
    const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(users)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'LEAD_MANAGER';
  screenPermissions: string[];
}) {
  try {
    await checkSuperAdmin();

    const parsed = AdminUserCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ email: validatedData.email.toLowerCase().trim() });
    if (existing) {
      return { success: false, error: 'An admin user with this email already exists' };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const newUser = await User.create({
      name: validatedData.name.trim(),
      email: validatedData.email.toLowerCase().trim(),
      password: hashedPassword,
      role: validatedData.role,
      screenPermissions: validatedData.screenPermissions || [],
      isActive: true,
    });

    await logAuditAction({
      action: 'ADMIN_USER_CREATED',
      entity: 'User',
      entityId: newUser._id.toString(),
      metadata: { name: newUser.name, email: newUser.email, role: newUser.role, screenPermissions: newUser.screenPermissions },
    });

    revalidatePath('/admin/system/users');
    return { 
      success: true, 
      data: {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        screenPermissions: newUser.screenPermissions,
        isActive: newUser.isActive,
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminUser(
  id: string,
  data: {
    name?: string;
    role?: 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'LEAD_MANAGER';
    screenPermissions?: string[];
    isActive?: boolean;
    password?: string;
  }
) {
  try {
    await checkSuperAdmin();

    const parsed = AdminUserUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const updatePayload: any = { ...validatedData };
    if (validatedData.password) {
      updatePayload.password = await bcrypt.hash(validatedData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updatePayload, { new: true })
      .select('-password')
      .lean();

    if (!updatedUser) {
      return { success: false, error: 'User not found' };
    }

    await logAuditAction({
      action: 'ADMIN_USER_UPDATED',
      entity: 'User',
      entityId: id,
      metadata: { role: data.role, screenPermissions: data.screenPermissions, isActive: data.isActive },
    });

    revalidatePath('/admin/system/users');
    return { success: true, data: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminUser(id: string) {
  try {
    const session = await checkSuperAdmin();
    await dbConnect();

    if (session.userId === id) {
      return { success: false, error: 'You cannot delete your own account' };
    }

    await User.findByIdAndDelete(id);

    await logAuditAction({
      action: 'ADMIN_USER_DELETED',
      entity: 'User',
      entityId: id,
    });

    revalidatePath('/admin/system/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
