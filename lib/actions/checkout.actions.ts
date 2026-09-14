'use server';

import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { Customer } from '@/lib/models/customer';
import { Product } from '@/lib/models/product';
import { ProductVariant } from '@/lib/models/product-variant';
import { Category } from '@/lib/models/category';
import Counter from '@/lib/models/counter';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { reserveInventory } from '@/lib/inventory';

/**
 * Resolves the REAL, database-backed price/quantity for every cart line
 * submitted by the client. SECURITY: `item.price` (and `item.variantValue`)
 * from the client are never trusted for money — placeOrder used to multiply
 * the client-submitted price straight into the order total and, downstream,
 * into the Razorpay payment amount, so a forged `price: 1` in the request
 * body would let anyone pay a token amount for real stock. Every line's
 * price now comes from `ProductVariant.price` looked up here, matching
 * `resolveVariant()`'s "fall back to the product's only variant" rule in
 * lib/inventory.ts so single-SKU checkout keeps working the same way.
 * Batches its lookups ($in) instead of querying per line.
 */
async function resolveOrderItems(items: any[]) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const variantIds = items.map((i) => i?.variantId).filter(Boolean);
  const productIdsNeedingFallback = items
    .filter((i) => !i?.variantId)
    .map((i) => i?.productId)
    .filter(Boolean);

  const [variantsById, fallbackVariants] = await Promise.all([
    variantIds.length ? ProductVariant.find({ _id: { $in: variantIds } }) : [],
    productIdsNeedingFallback.length
      ? ProductVariant.find({ productId: { $in: productIdsNeedingFallback } })
      : [],
  ]);

  const variantByIdMap = new Map(variantsById.map((v: any) => [v._id.toString(), v]));
  const fallbackByProductMap = new Map<string, any>();
  for (const v of fallbackVariants) {
    const pid = v.productId.toString();
    if (!fallbackByProductMap.has(pid)) fallbackByProductMap.set(pid, v);
  }

  const categoryIds = new Set<string>();
  for (const v of [...variantsById, ...fallbackVariants]) {
    if (v.categoryId) categoryIds.add(v.categoryId.toString());
  }
  const categories = categoryIds.size
    ? await Category.find({ _id: { $in: Array.from(categoryIds) } })
    : [];
  const calcOnValueByCategory = new Map(
    categories.map((c: any) => [c._id.toString(), !!c.calculatePriceOnVariantValue]),
  );

  const resolved: Array<{
    productId: string;
    variantId: string;
    sku?: string;
    name: string;
    quantity: number;
    price: number;
    variantValue?: number;
    calculatePriceOnVariantValue: boolean;
    lineTotal: number;
  }> = [];

  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Invalid item quantity');
    }

    let variant = item?.variantId ? variantByIdMap.get(String(item.variantId)) : undefined;
    if (!variant && item?.productId) variant = fallbackByProductMap.get(String(item.productId));
    if (!variant) {
      throw new Error('One of the items in your cart is no longer available.');
    }

    const calcOnValue = variant.categoryId
      ? !!calcOnValueByCategory.get(variant.categoryId.toString())
      : false;
    const price = variant.price; // canonical, from the database — never from `item.price`
    const variantValue = variant.variantValue;
    const lineTotal = calcOnValue && variantValue ? price * quantity * variantValue : price * quantity;

    resolved.push({
      productId: variant.productId.toString(),
      variantId: variant._id.toString(),
      sku: variant.sku,
      name: variant.name,
      quantity,
      price,
      variantValue,
      calculatePriceOnVariantValue: calcOnValue,
      lineTotal,
    });
  }

  return resolved;
}

export async function placeOrder(data: any) {
  try {
    await dbConnect();

    // Validate required fields (basic validation for now)
    if (!data.customerName || !data.phone || !data.shippingAddress) {
      return { success: false, error: 'Missing required fields' };
    }

    const session = await getSession();

    // Resolve canonical prices/quantities BEFORE starting the transaction —
    // if a line item doesn't resolve (deleted product, tampered ID), fail
    // fast without ever opening a transaction or reserving stock.
    let resolvedItems;
    try {
      resolvedItems = await resolveOrderItems(data.items);
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to validate cart items' };
    }

    // Start transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 1. Generate Order Number
      const counter = await Counter.findOneAndUpdate(
        { id: 'orderId' },
        { $inc: { seq: 1 } },
        { returnDocument: 'after', upsert: true, session: dbSession }
      );
      const orderNumber = `ORD-${new Date().getFullYear()}-${counter.seq.toString().padStart(4, '0')}`;

      const serverSubtotal = resolvedItems.reduce((acc, item) => acc + item.lineTotal, 0);
      const totals = await calculateOrderTotals(serverSubtotal, data.shippingAddress.state || "", data.purchaseType || "PERSONAL");

      const orderPayload = {
        ...data,
        items: resolvedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          variantValue: item.variantValue,
          calculatePriceOnVariantValue: item.calculatePriceOnVariantValue,
        })),
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
      for (const item of resolvedItems) {
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
          metrics: { totalOrders: 1, totalSpend: totals.total }
        }], { session: dbSession });
        customer = customer[0]; // because create returns an array when passed an array
      } else {
        // Update existing customer metrics
        customer.metrics.totalOrders = (customer.metrics.totalOrders || 0) + 1;
        customer.metrics.totalSpend = (customer.metrics.totalSpend || 0) + totals.total;
        
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
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error('RAZORPAY_KEY_SECRET is not configured');
    return false;
  }
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  // Constant-time compare: a plain === leaks timing information about how
  // many leading bytes matched, which matters on a payment-integrity check.
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(razorpay_signature || '');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
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
