'use server';

import dbConnect from '@/lib/db';
import { Order } from '@/lib/models/order';
import { Customer } from '@/lib/models/customer';
import { ProductVariant } from '@/lib/models/product-variant';
import { Category } from '@/lib/models/category';
import Counter from '@/lib/models/counter';
import mongoose from 'mongoose';
import { reserveInventory, finalizeInventory } from '@/lib/inventory';
import { getSession } from '@/lib/auth';

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
      const totals = await calculateOrderTotals(serverSubtotal, data.shippingAddress.state || "");

      // 2. Identify Authenticated User and Customer Profile
      const session = await getSession();
      const authenticatedUserId = session?.userId ? new mongoose.Types.ObjectId(session.userId) : null;
      const userEmail = session?.email || data.email || '';

      // Find customer strictly by user account or account email (NEVER by phone alone)
      let customer = null;
      if (authenticatedUserId) {
        customer = await Customer.findOne({ userId: authenticatedUserId }).session(dbSession);
      }
      if (!customer && userEmail) {
        customer = await Customer.findOne({ 'contact.email': userEmail }).session(dbSession);
        if (customer && authenticatedUserId && !customer.userId) {
          customer.userId = authenticatedUserId;
        }
      }

      // Customer.addresses sub-schema validation
      const customerAddress = {
        name: data.customerName,
        phone: data.phone,
        street1: data.shippingAddress.street,
        street2: data.shippingAddress.apartment || undefined,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        zip: data.shippingAddress.pincode,
        country: data.shippingAddress.country || 'India',
      };

      if (!customer) {
        // Create new customer profile linked to the authenticated user
        const newCustomerList = await Customer.create([{
          type: 'PERSONAL',
          userId: authenticatedUserId || undefined,
          contact: { email: userEmail, phone: data.phone },
          profile: {
            firstName: data.customerName.split(' ')[0],
            lastName: data.customerName.split(' ').slice(1).join(' ') || ''
          },
          addresses: [customerAddress],
          metrics: { totalOrders: 1, totalSpend: totals.total }
        }], { session: dbSession });
        customer = newCustomerList[0];
      } else {
        // Update existing customer metrics
        customer.metrics = customer.metrics || { totalOrders: 0, totalSpend: 0 };
        customer.metrics.totalOrders = (customer.metrics.totalOrders || 0) + 1;
        customer.metrics.totalSpend = (customer.metrics.totalSpend || 0) + totals.total;

        if (authenticatedUserId && !customer.userId) {
          customer.userId = authenticatedUserId;
        }
        if (!customer.contact?.phone) {
          customer.contact = customer.contact || {};
          customer.contact.phone = data.phone;
        }
        if (!customer.contact?.email && userEmail) {
          customer.contact = customer.contact || {};
          customer.contact.email = userEmail;
        }

        // Avoid duplicate address entries
        const existingAddresses = customer.addresses || [];
        const addressExists = existingAddresses.some(
          (addr: any) =>
            addr.street1 === customerAddress.street1 &&
            addr.zip === customerAddress.zip &&
            addr.city === customerAddress.city
        );
        if (!addressExists) {
          existingAddresses.push(customerAddress);
          customer.addresses = existingAddresses;
        }

        await customer.save({ session: dbSession });
      }

      const orderPayload = {
        ...data,
        userId: authenticatedUserId || undefined,
        customerId: customer._id,
        // Retail-only storefront — no business/GST purchase flow.
        purchaseType: 'PERSONAL',
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

      // 3. Create the Order
      const newOrder = await Order.create([orderPayload], { session: dbSession });

      // 4. Update Product Inventory
      for (const item of resolvedItems) {
        await reserveInventory(item.productId, item.variantId, item.quantity, dbSession);
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

import { createCashfreeOrder, fetchCashfreeOrder } from '@/lib/services/cashfree';

/**
 * Reconciles an order's payment state directly with Cashfree.
 * Called automatically when an order is checked or viewed, ensuring that orders
 * paid via Cashfree get confirmed even if the webhook couldn't reach localhost.
 */
export async function finalizeCashfreePayment(orderNumber: string, cfOrderData?: any) {
  try {
    await dbConnect();
    const order = await Order.findOne({ orderNumber });
    if (!order) return { success: false, error: 'Order not found' };

    if (order.paymentStatus === 'CONFIRMED') {
      return { success: true, paymentStatus: 'CONFIRMED', orderStatus: order.orderStatus };
    }

    const cfOrder = cfOrderData || (await fetchCashfreeOrder(orderNumber));
    if (!cfOrder || cfOrder.order_status !== 'PAID') {
      return { success: false, status: cfOrder?.order_status || 'PENDING' };
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      order.paymentStatus = 'CONFIRMED';
      order.orderStatus = 'CONFIRMED';
      if (cfOrder.cf_order_id) {
        order.gatewayOrderId = String(cfOrder.cf_order_id);
      }
      await order.save({ session });

      for (const item of order.items) {
        if (item.productId && item.variantId) {
          await finalizeInventory(item.productId.toString(), item.variantId, item.quantity, session);
        }
      }

      await session.commitTransaction();
      session.endSession();

      return { success: true, paymentStatus: 'CONFIRMED', orderStatus: 'CONFIRMED' };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err: any) {
    console.error('finalizeCashfreePayment error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Creates the Cashfree order + payment session for an order that
 * `placeOrder` already wrote to Mongo. Looked up by `orderNumber` (which
 * doubles as the Cashfree `order_id`) and priced from `order.total` —
 * never from a client-submitted amount, same rule `resolveOrderItems`
 * enforces above for cart line prices.
 */
export async function createCashfreePaymentSession(orderNumber: string) {
  try {
    await dbConnect();
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    if (order.paymentStatus === 'CONFIRMED') {
      return { success: false, error: 'This order has already been paid.' };
    }

    const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');

    const session = await createCashfreeOrder({
      orderNumber: order.orderNumber,
      amount: order.total,
      customerName: order.customerName,
      customerEmail: order.email,
      customerPhone: order.phone,
      returnUrl: `${baseUrl}/checkout/success?order=${order.orderNumber}`,
      notifyUrl: `${baseUrl}/api/webhooks/cashfree`,
    });

    return { success: true, paymentSessionId: session.payment_session_id };
  } catch (error: any) {
    console.error('createCashfreePaymentSession error:', error);
    return { success: false, error: error.message || 'Failed to initiate payment.' };
  }
}

/**
 * Minimal, unauthenticated-safe order status lookup for the checkout
 * success page — automatically verifies and syncs with Cashfree if still PENDING.
 */
export async function getOrderStatusSummary(orderNumber: string) {
  try {
    await dbConnect();
    const order = await Order.findOne({ orderNumber }).select(
      'orderNumber paymentMethod paymentStatus orderStatus total',
    );
    if (!order) return { success: false, error: 'Order not found' };

    // Real-time payment reconciliation:
    // If an online order is still PENDING, verify directly with Cashfree
    if (
      order.paymentStatus === 'PENDING' &&
      order.paymentMethod !== 'COD' &&
      order.paymentMethod !== 'BANK_TRANSFER'
    ) {
      const syncResult = await finalizeCashfreePayment(orderNumber);
      if (syncResult.success && syncResult.paymentStatus === 'CONFIRMED') {
        order.paymentStatus = 'CONFIRMED';
        order.orderStatus = 'CONFIRMED';
      }
    }

    return {
      success: true,
      data: {
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        total: order.total,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function calculateOrderTotals(subtotal: number, state: string) {
  // Free shipping over ₹25,000, otherwise ₹500
  const shippingFee = subtotal > 25000 ? 0 : 500;
  
  // Tax calculation for Jewellery (usually 3% in India)
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
