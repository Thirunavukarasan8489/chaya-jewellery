'use server';

import dbConnect from '@/lib/db';
import { ReturnRequest } from '@/lib/models/return';
import { Order } from '@/lib/models/order';
import { Product } from '@/lib/models/product';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { ReturnCreateSchema, ReturnProcessSchema } from '@/lib/validations/return.schema';
import { restockInventory } from '@/lib/inventory';

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

// Generate unique return number
const generateReturnNumber = async () => {
  const count = await ReturnRequest.countDocuments();
  return `RET-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
};

export async function getReturns() {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const returns = await ReturnRequest.find()
      .populate('orderId', 'orderNumber customerName total')
      .sort({ createdAt: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(returns)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReturnById(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const returnReq = await ReturnRequest.findById(id).populate('orderId');
    if (!returnReq) return { success: false, error: 'Return request not found' };
    return { success: true, data: JSON.parse(JSON.stringify(returnReq)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createReturn(data: {
  orderId: string;
  items: any[];
  reason: string;
}) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    const parsed = ReturnCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const returnNumber = await generateReturnNumber();
    
    const returnReq = await ReturnRequest.create({
      returnNumber,
      orderId: validatedData.orderId,
      items: validatedData.items,
      reason: validatedData.reason,
      status: 'PENDING_INSPECTION'
    });

    revalidatePath('/admin/returns');
    revalidatePath(`/admin/orders/${data.orderId}`);
    return { success: true, data: JSON.parse(JSON.stringify(returnReq)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processReturn(id: string, status: string, refundAmount: number, adminNotes?: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    const parsed = ReturnProcessSchema.safeParse({ status, refundAmount, adminNotes });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnReq = await ReturnRequest.findById(id).session(session);
      if (!returnReq) throw new Error('Return request not found');

      // If moving to APPROVED or REFUNDED, we must restock the items
      if (['APPROVED', 'REFUNDED'].includes(validatedData.status) && returnReq.status === 'PENDING_INSPECTION') {
        for (const item of returnReq.items) {
          if (!item.productId || !item.variantId) continue;
          await restockInventory(item.productId.toString(), item.variantId, item.quantity, session);
        }
        
        // Also update the order status
        await Order.findByIdAndUpdate(returnReq.orderId, { orderStatus: 'RETURNED' }, { session });
      }

      returnReq.status = validatedData.status;
      returnReq.refundAmount = validatedData.refundAmount;
      if (validatedData.adminNotes) {
        returnReq.adminNotes = validatedData.adminNotes;
      }
      
      await returnReq.save({ session });

      // If refund is issued, mark order as well
      if (validatedData.status === 'REFUNDED') {
        await Order.findByIdAndUpdate(returnReq.orderId, {
          orderStatus: 'RETURNED'
        }, { session });
      }

      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/admin/returns');
      revalidatePath(`/admin/returns/${id}`);
      revalidatePath(`/admin/orders/${returnReq.orderId}`);
      
      return { success: true, data: JSON.parse(JSON.stringify(returnReq)) };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
