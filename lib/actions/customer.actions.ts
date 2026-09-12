'use server';

import dbConnect from '@/lib/db';
import { Customer } from '@/lib/models/customer';
import { getSession } from '@/lib/auth';

// Helper to check auth
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  // Normalize roles to match DB ENUMS (SUPER_ADMIN, etc.)
  const normRoles = allowedRoles.map(r => r.replace(' ', '_').toUpperCase());
  if (!normRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

export async function getCustomers(type?: 'PERSONAL' | 'BUSINESS') {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager', 'Lead Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    
    const query = type ? { type } : {};
    const customers = await Customer.find(query).sort({ updatedAt: -1 }).lean();

    return { success: true, data: JSON.parse(JSON.stringify(customers)) };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomerById(id: string) {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager', 'Lead Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    
    const customer = await Customer.findById(id).lean();
    if (!customer) return { success: false, error: 'Customer not found' };

    return { success: true, data: JSON.parse(JSON.stringify(customer)) };
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomerProfile(userId: string, data: { firstName: string, lastName: string, phone: string }) {
  try {
    const session = await getSession();
    if (!session || session.userId !== userId) throw new Error('Unauthorized');

    await dbConnect();

    // Update Customer Profile
    const updatedCustomer = await Customer.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          'profile.firstName': data.firstName,
          'profile.lastName': data.lastName,
          'contact.phone': data.phone
        } 
      },
      { new: true }
    );

    if (!updatedCustomer) return { success: false, error: 'Customer not found' };

    return { success: true, data: JSON.parse(JSON.stringify(updatedCustomer)) };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { success: false, error: error.message };
  }
}
