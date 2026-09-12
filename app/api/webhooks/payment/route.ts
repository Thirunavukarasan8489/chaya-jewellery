import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { PaymentService } from '@/lib/services/payment';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-payment-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 1. Verify Webhook Signature
    // WARNING: Secret should come from environment variables
    const isValid = PaymentService.verifyWebhookSignature(payload, signature, process.env.PAYMENT_WEBHOOK_SECRET || 'dev_secret');
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Extract Data from Gateway Payload
    const orderId = payload.orderId;
    const paymentStatus = payload.status; // e.g. 'captured'

    await dbConnect();

    // 3. Transactional Update
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error('Order not found');
      }

      if (paymentStatus === 'captured') {
        order.paymentStatus = 'CONFIRMED';
        order.orderStatus = 'CONFIRMED'; // Move to confirmed queue for processing
      } else if (paymentStatus === 'failed') {
        order.paymentStatus = 'FAILED';
        // Note: Reserved inventory could be released here depending on business rules
      }

      await order.save({ session });
      await session.commitTransaction();

      return NextResponse.json({ received: true });
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
