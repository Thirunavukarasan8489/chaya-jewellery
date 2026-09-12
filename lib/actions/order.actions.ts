'use server';

import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { Product } from '@/lib/models/product';
import Counter from '@/lib/models/counter';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import { logAuditAction } from '@/lib/actions/audit';
import { OrderCreateSchema, OrderUpdateSchema } from '@/lib/validations/order.schema';
import { reserveInventory, finalizeInventory, releaseInventory, restockInventory } from '@/lib/inventory';

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

export async function getOrders(page = 1, limit = 50) {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager', 'Lead Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    const skip = (page - 1) * limit;
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();

    const totalCount = await Order.countDocuments({});

    return {
      success: true,
      data: JSON.parse(JSON.stringify(orders)),
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return { success: false, error: error.message };
  }
}

export async function getOrderById(id: string) {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager', 'Lead Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    const order = await Order.findById(id).lean();
    if (!order) return { success: false, error: 'Order not found' };

    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return { success: false, error: error.message };
  }
}

export async function createOrder(data: any) {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager', 'Lead Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    const parsed = OrderCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const validatedData = parsed.data;

    await dbConnect();

    // We must use a MongoDB transaction since we're modifying Order and Product stock
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Generate Order Number
      const counter = await Counter.findOneAndUpdate(
        { id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
      );
      const orderNumber = `ORD-${new Date().getFullYear()}-${counter.seq.toString().padStart(4, '0')}`;

      const orderPayload = {
        ...validatedData,
        orderNumber,
      };

      // 2. Create the Order
      const newOrder = await Order.create([orderPayload], { session });

      // 3. Update Product Inventory
      for (const item of validatedData.items) {
        if (!item.productId || !item.variantId) continue;

        await reserveInventory(item.productId.toString(), item.variantId, item.quantity, session);

        // If order is created as paid, immediately finalize
        if (validatedData.paymentStatus === 'CONFIRMED') {
          await finalizeInventory(item.productId.toString(), item.variantId, item.quantity, session);
        }
      }

      await session.commitTransaction();
      session.endSession();

      revalidatePath('/admin/orders');
      return { success: true, data: JSON.parse(JSON.stringify(newOrder[0])) };
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatus(id: string, updateData: { orderStatus?: string, paymentStatus?: string }) {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager', 'Lead Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    const parsed = OrderUpdateSchema.safeParse(updateData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await dbConnect();

    const order = await Order.findByIdAndUpdate(id, parsed.data, { new: true }).lean();
    if (!order) return { success: false, error: 'Order not found' };

    await logAuditAction({
      action: 'ORDER_STATUS_UPDATED',
      entity: 'Order',
      entityId: id,
      metadata: parsed.data
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(order)) };
  } catch (error: any) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
}

export async function cancelOrder(id: string, reason: string) {
  try {
    const isAuth = await checkAuth(['Super Admin', 'Content Manager']);
    if (!isAuth) return { success: false, error: 'Unauthorized' };

    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error('Order not found');

      if (['CANCELLED', 'RETURNED'].includes(order.orderStatus)) {
        throw new Error('Order is already cancelled or returned');
      }

      // Restock or release inventory depending on payment status
      for (const item of order.items) {
        if (!item.productId || !item.variantId) continue;
        if (order.paymentStatus === 'PENDING') {
          // It was only reserved
          await releaseInventory(item.productId.toString(), item.variantId, item.quantity, session);
        } else {
          // It was paid and finalized, so restock it
          await restockInventory(item.productId.toString(), item.variantId, item.quantity, session);
        }
      }

      order.orderStatus = 'CANCELLED';
      // Ideally we would add cancellationReason to the schema, but we can append it to admin notes or just set status.
      if (reason) {
        order.notes = order.notes ? `${order.notes}\nCancellation Reason: ${reason}` : `Cancellation Reason: ${reason}`;
      }

      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      await logAuditAction({
        action: 'ORDER_CANCELLED',
        entity: 'Order',
        entityId: id,
        metadata: { reason }
      });

      revalidatePath('/admin/orders');
      revalidatePath(`/admin/orders/${id}`);
      return { success: true, data: JSON.parse(JSON.stringify(order)) };
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return { success: false, error: error.message };
  }
}
