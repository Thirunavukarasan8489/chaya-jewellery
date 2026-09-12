import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { releaseInventory } from '@/lib/inventory';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    // Basic security for cron (Vercel provides CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    // Find orders that are PAYMENT_PENDING and older than 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const expiredOrders = await Order.find({
      orderStatus: 'PAYMENT_PENDING',
      createdAt: { $lt: thirtyMinsAgo }
    });

    let processedCount = 0;

    for (const order of expiredOrders) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        order.orderStatus = 'CANCELLED';
        order.notes = order.notes ? `${order.notes}\nSystem: Cancelled due to payment timeout.` : `System: Cancelled due to payment timeout.`;
        await order.save({ session });

        // Release reserved inventory
        for (const item of order.items) {
          if (item.productId && item.variantId) {
            await releaseInventory(item.productId.toString(), item.variantId, item.quantity, session);
          }
        }

        await session.commitTransaction();
        session.endSession();
        processedCount++;
      } catch (err) {
        console.error(`Failed to release inventory for order ${order._id}:`, err);
        await session.abortTransaction();
        session.endSession();
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
