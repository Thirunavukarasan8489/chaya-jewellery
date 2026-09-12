'use server';

import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { Customer } from '@/lib/models/customer';
import { Product } from '@/lib/models/product';
import Counter from '@/lib/models/counter';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { reserveInventory } from '@/lib/inventory';

export async function placeOrder(data: any) {
  try {
    await dbConnect();
    
    // Validate required fields (basic validation for now)
    if (!data.customerName || !data.phone || !data.shippingAddress) {
      return { success: false, error: 'Missing required fields' };
    }

    const session = await getSession();

    // Start transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 1. Generate Order Number
      const counter = await Counter.findOneAndUpdate(
        { id: 'orderId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session: dbSession }
      );
      const orderNumber = `ORD-${new Date().getFullYear()}-${counter.seq.toString().padStart(4, '0')}`;
      
      const serverSubtotal = data.items.reduce((acc: number, item: any) => {
        if (item.calculatePriceOnVariantValue && item.variantValue) {
          return acc + (item.price * item.quantity * item.variantValue);
        }
        return acc + (item.price * item.quantity);
      }, 0);
      const totals = await calculateOrderTotals(serverSubtotal, data.shippingAddress.state || "", data.purchaseType || "PERSONAL");

      const orderPayload = {
        ...data,
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        tax: totals.tax,
        total: totals.total,
        orderNumber,
        orderStatus: 'PAYMENT_PENDING',
        paymentStatus: 'PENDING'
      };

      // 2. Create the Order
      const newOrder = await Order.create([orderPayload], { session: dbSession });

      // 3. Update Product Inventory
      for (const item of data.items) {
        if (!item.productId || !item.variantId) continue;
        await reserveInventory(item.productId, item.variantId, item.quantity, dbSession);
      }

      // 4. Update or Create Customer Profile Metrics
      let customer = await Customer.findOne({ 'contact.phone': data.phone }).session(dbSession);
      
      if (!customer) {
        // If guest checkout and customer doesn't exist, create one
        customer = await Customer.create([{
          type: data.purchaseType || 'PERSONAL',
          contact: { email: data.email, phone: data.phone },
          profile: { firstName: data.customerName.split(' ')[0], lastName: data.customerName.split(' ').slice(1).join(' ') || '' },
          addresses: [data.shippingAddress],
          metrics: { totalOrders: 1, totalSpend: data.total }
        }], { session: dbSession });
        customer = customer[0]; // because create returns an array when passed an array
      } else {
        // Update existing customer metrics
        customer.metrics.totalOrders = (customer.metrics.totalOrders || 0) + 1;
        customer.metrics.totalSpend = (customer.metrics.totalSpend || 0) + data.total;
        
        // Ensure address is saved if new
        // Basic check: just add if address array is empty
        if (!customer.addresses || customer.addresses.length === 0) {
          customer.addresses = [data.shippingAddress];
        }
        
        await customer.save({ session: dbSession });
      }

      await dbSession.commitTransaction();
      dbSession.endSession();

      return { success: true, data: JSON.parse(JSON.stringify(newOrder[0])) };
    } catch (error: any) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
  } catch (error: any) {
    console.error('Error placing order:', error);
    return { success: false, error: error.message };
  }
}

import Razorpay from 'razorpay';
import crypto from 'crypto';

export async function createRazorpayOrder(amount: number) {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };

    const order = await instance.orders.create(options);
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return { success: false, error: "Payment initiation failed." };
  }
}

export async function verifyRazorpaySignature(razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === razorpay_signature;
}

export async function calculateOrderTotals(subtotal: number, state: string, purchaseType: string) {
  // Free shipping over ₹25,000, otherwise ₹500
  const shippingFee = subtotal > 25000 ? 0 : 500;
  
  // Tax calculation for Gemstones (usually 3% in India)
  // We define merchant state as Maharashtra for this example.
  const MERCHANT_STATE = "MAHARASHTRA";
  const userState = state.toUpperCase().trim();
  
  let cgst = 0, sgst = 0, igst = 0;
  const taxRate = 0.03; // 3%
  const taxAmount = Math.round(subtotal * taxRate);

  if (userState === MERCHANT_STATE) {
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
  } else {
    igst = taxAmount;
  }

  return {
    subtotal,
    shippingFee,
    tax: taxAmount,
    cgst,
    sgst,
    igst,
    total: subtotal + shippingFee + taxAmount
  };
}
