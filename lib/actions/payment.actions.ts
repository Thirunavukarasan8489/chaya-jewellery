'use server';

import dbConnect from '@/lib/db';
import { Payment } from '@/lib/models/payment';
import { Order } from '@/lib/models/order';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { PaymentCreateSchema, PaymentUpdateSchema } from '@/lib/validations/payment.schema';
import { finalizeInventory } from '@/lib/inventory';

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

// Generate unique payment number
const generatePaymentNumber = async () => {
  const count = await Payment.countDocuments();
  return `PAY-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
};

export async function getPayments(page = 1, limit = 50) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const skip = (page - 1) * limit;
    const payments = await Payment.find()
      .populate('orderId', 'orderNumber customerName total')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return { success: true, data: JSON.parse(JSON.stringify(payments)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPaymentById(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const payment = await Payment.findById(id).populate('orderId');
    if (!payment) return { success: false, error: 'Payment not found' };
    return { success: true, data: JSON.parse(JSON.stringify(payment)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPayment(data: {
  orderId: string;
  method: string;
  amount: number;
  transactionId: string;
  notes?: string;
  updateOrderStatus?: boolean;
}) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    
    const parsed = PaymentCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    const paymentNumber = await generatePaymentNumber();
    
    // We start a transaction if we are also updating the order
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create payment
      const payment = await Payment.create([{
        paymentNumber,
        orderId: validatedData.orderId,
        method: validatedData.method,
        amount: validatedData.amount,
        transactionId: validatedData.transactionId,
        notes: validatedData.notes,
        status: 'COMPLETED' // Usually manual recording implies it's completed
      }], { session });

      if (validatedData.updateOrderStatus) {
        const order = await Order.findById(validatedData.orderId).session(session);
        if (order && order.paymentStatus !== 'CONFIRMED') {
          order.paymentStatus = 'CONFIRMED';
          await order.save({ session });
          for (const item of order.items) {
            if (item.productId && item.variantId) {
              await finalizeInventory(item.productId.toString(), item.variantId, item.quantity, session);
            }
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/admin/payments');
      revalidatePath(`/admin/orders/${data.orderId}`);
      return { success: true, data: JSON.parse(JSON.stringify(payment[0])) };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePaymentStatus(id: string, status: string, syncOrder: boolean = true) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    const parsed = PaymentUpdateSchema.safeParse({ status });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedStatus = parsed.data.status;

    await dbConnect();

    const updateData: any = { status: validatedStatus };

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findByIdAndUpdate(id, updateData, { new: true, session });
      if (!payment) throw new Error('Payment not found');

      if (syncOrder) {
        let orderPaymentStatus = 'PENDING';
        if (validatedStatus === 'COMPLETED') orderPaymentStatus = 'CONFIRMED';
        if (validatedStatus === 'FAILED') orderPaymentStatus = 'FAILED';
        // Note: REFUNDED doesn't exist directly on order.paymentStatus usually, but can be managed.
        
        if (orderPaymentStatus !== 'PENDING') {
          const order = await Order.findById(payment.orderId).session(session);
          if (order && order.paymentStatus !== orderPaymentStatus) {
            order.paymentStatus = orderPaymentStatus;
            await order.save({ session });
            if (validatedStatus === 'COMPLETED') {
              for (const item of order.items) {
                if (item.productId && item.variantId) {
                  await finalizeInventory(item.productId.toString(), item.variantId, item.quantity, session);
                }
              }
            }
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/admin/payments');
      revalidatePath(`/admin/payments/${id}`);
      revalidatePath(`/admin/orders/${payment.orderId}`);
      
      return { success: true, data: JSON.parse(JSON.stringify(payment)) };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
