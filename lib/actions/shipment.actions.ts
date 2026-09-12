'use server';

import dbConnect from '@/lib/db';
import { Shipment } from '@/lib/models/shipment';
import { Order } from '@/lib/models/order';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

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

// Generate unique shipment number
const generateShipmentNumber = async () => {
  const count = await Shipment.countDocuments();
  return `SHP-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
};

export async function getShipments() {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']); // Add appropriate roles
    await dbConnect();
    const shipments = await Shipment.find()
      .populate('orderId', 'orderNumber customerName shippingAddress')
      .sort({ createdAt: -1 });
    return { success: true, data: JSON.parse(JSON.stringify(shipments)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getShipmentById(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER', 'LEAD_MANAGER']);
    await dbConnect();
    const shipment = await Shipment.findById(id).populate('orderId');
    if (!shipment) return { success: false, error: 'Shipment not found' };
    return { success: true, data: JSON.parse(JSON.stringify(shipment)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createShipment(data: {
  orderId: string;
  courierName: string;
  trackingNumber: string;
  items: any[];
  notes?: string;
  updateOrderStatus?: boolean;
}) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    const shipmentNumber = await generateShipmentNumber();
    
    // We start a transaction if we are also updating the order
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const shipment = await Shipment.create([{
        shipmentNumber,
        orderId: data.orderId,
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        items: data.items,
        notes: data.notes,
        status: 'PENDING'
      }], { session });

      if (data.updateOrderStatus) {
        await Order.findByIdAndUpdate(data.orderId, {
          orderStatus: 'SHIPPED'
        }, { session });
      }

      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/admin/shipments');
      revalidatePath(`/admin/orders/${data.orderId}`);
      return { success: true, data: JSON.parse(JSON.stringify(shipment[0])) };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateShipmentStatus(id: string, status: string, syncOrder: boolean = true) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    const updateData: any = { status };
    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const shipment = await Shipment.findByIdAndUpdate(id, updateData, { new: true, session });
      if (!shipment) throw new Error('Shipment not found');

      if (syncOrder) {
        // Sync the parent order status if requested
        await Order.findByIdAndUpdate(shipment.orderId, { orderStatus: status }, { session });
      }

      await session.commitTransaction();
      session.endSession();
      
      revalidatePath('/admin/shipments');
      revalidatePath(`/admin/shipments/${id}`);
      revalidatePath(`/admin/orders/${shipment.orderId}`);
      
      return { success: true, data: JSON.parse(JSON.stringify(shipment)) };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
