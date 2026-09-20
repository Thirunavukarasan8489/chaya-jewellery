"use server";

import dbConnect from "@/lib/db";
import { Order } from "@/lib/models/order";
import { Customer } from "@/lib/models/customer";
import { ProductVariant } from "@/lib/models/product-variant";
import { Product } from "@/lib/models/product";
import { Payment } from "@/lib/models/payment";
import { Category } from "@/lib/models/category";
import Counter from "@/lib/models/counter";
import mongoose from "mongoose";
import { reserveInventory } from "@/lib/inventory";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import {
  CashfreeApiError,
  cashfreeCreateOrderRequest,
  cashfreeMode,
  cashfreeMerchantOrderId,
  cashfreeOrderMatchesCheckout,
  createCashfreeOrder,
  fetchCashfreeOrder,
} from "@/lib/services/cashfree";
import {
  checkoutPaymentNumber,
  ensureCheckoutPayment,
  isOnlinePayment,
  reconcileCashfreePayment,
} from "@/lib/services/checkout-payment";
import {
  CashfreeSdkResultSchema,
  CheckoutSchema,
} from "@/lib/validations/checkout.schema";

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
    throw new Error("Cart is empty");
  }

  const variantIds = items.map((i) => i?.variantId).filter(Boolean);
  const products = await Product.find({
    _id: { $in: items.map((item) => item.productId) },
    status: "ACTIVE",
  });
  const productById = new Map(
    products.map((product: any) => [String(product._id), product]),
  );
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

  const variantByIdMap = new Map(
    variantsById.map((v: any) => [v._id.toString(), v]),
  );
  const fallbackByProductMap = new Map<string, any>();
  for (const v of fallbackVariants) {
    const pid = v.productId.toString();
    // A product with multiple variants requires an explicit selection.
    fallbackByProductMap.set(pid, fallbackByProductMap.has(pid) ? null : v);
  }

  const categoryIds = new Set<string>();
  for (const v of [...variantsById, ...fallbackVariants]) {
    if (v.categoryId) categoryIds.add(v.categoryId.toString());
  }
  const categories = categoryIds.size
    ? await Category.find({ _id: { $in: Array.from(categoryIds) } })
    : [];
  const calcOnValueByCategory = new Map(
    categories.map((c: any) => [
      c._id.toString(),
      !!c.calculatePriceOnVariantValue,
    ]),
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
    const product: any = productById.get(String(item.productId));
    if (!product || product.purchaseType === "ENQUIRE_ONLY") {
      throw new Error(
        "One of the products is no longer available for purchase.",
      );
    }
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("Invalid item quantity");
    }

    let variant = item?.variantId
      ? variantByIdMap.get(String(item.variantId))
      : undefined;
    if (!variant && item?.productId)
      variant = fallbackByProductMap.get(String(item.productId));
    if (
      !variant ||
      String(variant.productId) !== String(item.productId) ||
      variant.purchaseType === "ENQUIRE_ONLY"
    ) {
      throw new Error("One of the items in your cart is no longer available.");
    }

    const calcOnValue = variant.categoryId
      ? !!calcOnValueByCategory.get(variant.categoryId.toString())
      : false;
    const price = variant.price; // canonical, from the database — never from `item.price`
    const variantValue = variant.variantValue;
    const lineTotal =
      calcOnValue && variantValue
        ? price * quantity * variantValue
        : price * quantity;
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(lineTotal) ||
      lineTotal <= 0
    ) {
      throw new Error("One of the products has an invalid price.");
    }

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

function checkoutResult(order: any, fingerprint: string) {
  if (order.checkoutFingerprint !== fingerprint)
    return {
      success: false,
      error: "Checkout details changed. Please start a new checkout.",
      restartCheckout: true,
    };
  if (order.orderStatus === "CANCELLED")
    return {
      success: false,
      error: "This checkout expired. Please try again.",
      restartCheckout: true,
    };
  return { success: true, data: JSON.parse(JSON.stringify(order)) };
}

export async function placeOrder(input: unknown) {
  let checkoutKey: string | undefined;
  let userId: string | undefined;
  let fingerprint = "";
  try {
    const identity = await getSession();
    if (!identity)
      return { success: false, error: "Please sign in to place your order." };
    const parsed = CheckoutSchema.safeParse(input);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0].message };
    const data = parsed.data;
    checkoutKey = data.checkoutKey;
    userId = identity.userId;
    fingerprint = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
    await dbConnect();
    const existing = await Order.findOne({ checkoutKey, userId });
    if (existing) return checkoutResult(existing, fingerprint);

    // Resolve canonical prices/quantities BEFORE starting the transaction —
    // if a line item doesn't resolve (deleted product, tampered ID), fail
    // fast without ever opening a transaction or reserving stock.
    let resolvedItems;
    try {
      resolvedItems = await resolveOrderItems(data.items);
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Unable to validate cart items",
      };
    }

    // Start transaction
    const dbSession = await mongoose.startSession();
    try {
      return await dbSession.withTransaction(async () => {
        // Check and reserve every line BEFORE creating order/payment records.
        // Any shortage or concurrent stock change rolls the entire transaction back.
        for (const item of resolvedItems) {
          await reserveInventory(
            item.productId,
            item.variantId,
            item.quantity,
            dbSession,
          );
        }
        // 1. Generate Order Number
        const counter = await Counter.findOneAndUpdate(
          { id: "orderId" },
          { $inc: { seq: 1 } },
          { returnDocument: "after", upsert: true, session: dbSession },
        );
        const orderNumber = `ORD-${new Date().getFullYear()}-${counter.seq.toString().padStart(4, "0")}`;

        const serverSubtotal = resolvedItems.reduce(
          (acc, item) => acc + item.lineTotal,
          0,
        );
        const totals = await calculateOrderTotals(
          serverSubtotal,
          data.shippingAddress.state || "",
        );

        // 2. Identify Authenticated User and Customer Profile
        const authenticatedUserId = new mongoose.Types.ObjectId(
          identity.userId,
        );
        const userEmail = identity.email;

        // Find customer strictly by user account or account email (NEVER by phone alone)
        let customer = null;
        if (authenticatedUserId) {
          customer = await Customer.findOne({
            userId: authenticatedUserId,
          }).session(dbSession);
        }
        if (!customer && userEmail) {
          customer = await Customer.findOne({
            "contact.email": userEmail,
          }).session(dbSession);
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
          country: data.shippingAddress.country || "India",
        };

        if (!customer) {
          // Create new customer profile linked to the authenticated user
          const newCustomerList = await Customer.create(
            [
              {
                type: "PERSONAL",
                userId: authenticatedUserId || undefined,
                contact: { email: userEmail, phone: data.phone },
                profile: {
                  firstName: data.customerName.split(" ")[0],
                  lastName:
                    data.customerName.split(" ").slice(1).join(" ") || "",
                },
                addresses: [customerAddress],
                metrics: { totalOrders: 1, totalSpend: totals.total },
              },
            ],
            { session: dbSession },
          );
          customer = newCustomerList[0];
        } else {
          // Update existing customer metrics
          customer.metrics = customer.metrics || {
            totalOrders: 0,
            totalSpend: 0,
          };
          customer.metrics.totalOrders =
            (customer.metrics.totalOrders || 0) + 1;
          customer.metrics.totalSpend =
            (customer.metrics.totalSpend || 0) + totals.total;

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
              addr.city === customerAddress.city,
          );
          if (!addressExists) {
            existingAddresses.push(customerAddress);
            customer.addresses = existingAddresses;
          }

          await customer.save({ session: dbSession });
        }

        const localOrderId = new mongoose.Types.ObjectId();
        const orderPayload = {
          ...data,
          _id: localOrderId,
          checkoutFingerprint: fingerprint,
          reservationExpiresAt: isOnlinePayment(data.paymentMethod)
            ? new Date(Date.now() + 30 * 60 * 1000)
            : undefined,
          cashfreeOrderId:
            data.paymentMethod === "COD" ||
            data.paymentMethod === "BANK_TRANSFER"
              ? undefined
              : cashfreeMerchantOrderId(localOrderId.toString()),
          userId: authenticatedUserId || undefined,
          customerId: customer._id,
          // Retail-only storefront — no business/GST purchase flow.
          purchaseType: "PERSONAL",
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
          orderStatus: "PAYMENT_PENDING",
          paymentStatus: "PENDING",
        };

        // 3. Create the Order
        const newOrder = await Order.create([orderPayload], {
          session: dbSession,
        });
        // The payment ledger and reservation commit together with the order.
        await ensureCheckoutPayment(newOrder[0], dbSession);
        return { success: true, data: JSON.parse(JSON.stringify(newOrder[0])) };
      });
    } finally {
      await dbSession.endSession();
    }
  } catch (error: any) {
    // Two identical submissions can both miss the first read. The unique key
    // picks one winner; the losing transaction rolls back its stock reservation.
    if (error.code === 11000 && checkoutKey && userId) {
      const existing = await Order.findOne({ checkoutKey, userId });
      if (existing) return checkoutResult(existing, fingerprint);
    }
    console.error("Error placing order:", error);
    return { success: false, error: error.message };
  }
}

/** Every browser-facing payment action checks ownership independently. */
async function ownedOrder(orderNumber: string) {
  const identity = await getSession();
  if (!identity) throw new Error("Please sign in to access this order.");
  await dbConnect();
  const order = await Order.findOne({ orderNumber, userId: identity.userId });
  if (!order) throw new Error("Order not found.");
  return order;
}

export async function finalizeCashfreePayment(orderNumber: string) {
  try {
    const order = await ownedOrder(orderNumber);
    return await reconcileCashfreePayment(String(order._id));
  } catch (error: any) {
    console.error("finalizeCashfreePayment error:", error);
    return { success: false as const, error: error.message };
  }
}

/** Save PGCreateOrder's response before giving its session ID to the browser. */
export async function createCashfreePaymentSession(orderNumber: string) {
  try {
    let order = await ownedOrder(orderNumber);
    if (!isOnlinePayment(order.paymentMethod))
      throw new Error("This order does not use online payment.");
    await ensureCheckoutPayment(order);
    if (order.paymentStatus === "CONFIRMED")
      return { success: true as const, alreadyPaid: true };
    if (order.orderStatus !== "PAYMENT_PENDING") {
      return {
        success: false as const,
        error: "This checkout is closed. Please start again.",
        restartCheckout: true,
      };
    }
    const expiresAt =
      order.reservationExpiresAt ||
      new Date(order.createdAt.getTime() + 30 * 60 * 1000);
    if (expiresAt.getTime() <= Date.now()) {
      const verified = await reconcileCashfreePayment(String(order._id));
      if (verified?.success && verified.paymentStatus === "CONFIRMED")
        return { success: true as const, alreadyPaid: true };
      return {
        success: false as const,
        error: "This checkout expired. Please start again.",
        restartCheckout: true,
      };
    }

    if (!order.cashfreeOrderId) {
      const legacy = await fetchCashfreeOrder(order.orderNumber);
      const matchesLegacy =
        legacy &&
        cashfreeOrderMatchesCheckout(legacy, {
          orderId: order.orderNumber,
          amount: order.total,
          customerEmail: order.email,
          customerPhone: order.phone,
          createdAt: order.createdAt,
        });
      const paymentOrderId = matchesLegacy
        ? order.orderNumber
        : cashfreeMerchantOrderId(String(order._id));
      order =
        (await Order.findOneAndUpdate(
          { _id: order._id, cashfreeOrderId: null },
          { $set: { cashfreeOrderId: paymentOrderId } },
          { returnDocument: "after" },
        )) || (await Order.findById(order._id));
      if (!order?.cashfreeOrderId)
        throw new Error("Unable to prepare payment. Please try again.");
    }

    const baseUrl = (
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    ).replace(/\/$/, "");
    const params = {
      orderId: order.cashfreeOrderId,
      amount: order.total,
      customerName: order.customerName,
      customerEmail: order.email,
      customerPhone: order.phone,
      returnUrl: `${baseUrl}/checkout/success?order=${order.orderNumber}`,
      notifyUrl: `${baseUrl}/api/webhooks/cashfree`,
      expiresAt,
    };
    const filter = { paymentNumber: checkoutPaymentNumber(order._id) };
    await Payment.updateOne(filter, {
      $set: {
        "cashfree.orderId": params.orderId,
        "cashfree.createRequest": cashfreeCreateOrderRequest(params),
        "cashfree.createRequestedAt": new Date(),
      },
    });

    let response;
    try {
      response = await createCashfreeOrder(params);
    } catch (error) {
      await Payment.updateOne(filter, {
        $set: {
          "cashfree.createError": {
            message:
              error instanceof Error
                ? error.message
                : "Cashfree request failed",
            response:
              error instanceof CashfreeApiError ? error.response : undefined,
            at: new Date(),
          },
        },
      });
      throw error;
    }
    await Payment.updateOne(filter, {
      $set: {
        "cashfree.createResponse": response,
        "cashfree.cfOrderId": String(response.cf_order_id),
        "cashfree.paymentSessionId": response.payment_session_id,
      },
      $unset: { "cashfree.createError": "" },
    });
    await Order.updateOne(
      { _id: order._id },
      { $set: { gatewayOrderId: String(response.cf_order_id) } },
    );

    if (response.order_status === "PAID") {
      const verified = await reconcileCashfreePayment(String(order._id));
      if (!verified?.success || verified.paymentStatus !== "CONFIRMED")
        throw new Error(
          "Unable to confirm the existing payment. Please check your orders.",
        );
      return { success: true as const, alreadyPaid: true };
    }
    if (response.order_status !== "ACTIVE" || !response.payment_session_id)
      throw new Error(
        "No active payment session. Please start checkout again.",
      );
    return {
      success: true as const,
      paymentSessionId: response.payment_session_id,
      orderId: response.order_id,
      cfOrderId: String(response.cf_order_id),
      mode: cashfreeMode(),
    };
  } catch (error: any) {
    console.error("createCashfreePaymentSession error:", error);
    return {
      success: false as const,
      error: error.message || "Failed to initiate payment.",
    };
  }
}

/** Record the SDK observation, then verify independently with Cashfree. */
export async function recordCashfreeCheckoutResult(
  orderNumber: string,
  result: unknown,
) {
  try {
    const order = await ownedOrder(orderNumber);
    if (!isOnlinePayment(order.paymentMethod))
      throw new Error("This is not an online payment.");
    const observation = CashfreeSdkResultSchema.parse(result);
    await ensureCheckoutPayment(order);
    await Payment.updateOne(
      { paymentNumber: checkoutPaymentNumber(order._id) },
      {
        $set: {
          "cashfree.sdkResponse": observation,
          "cashfree.sdkReceivedAt": new Date(),
        },
      },
    );
    return await reconcileCashfreePayment(String(order._id));
  } catch (error: any) {
    return {
      success: false as const,
      error:
        error.message ||
        "Unable to verify payment. Check your orders before paying again.",
    };
  }
}

export async function getOrderStatusSummary(orderNumber: string) {
  try {
    let order = await ownedOrder(orderNumber);
    if (
      isOnlinePayment(order.paymentMethod) &&
      order.paymentStatus !== "CONFIRMED"
    ) {
      // A failed attempt can be followed by a successful one on the same order.
      await finalizeCashfreePayment(orderNumber);
      order = await ownedOrder(orderNumber);
    }
    return {
      success: true as const,
      data: {
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        total: order.total,
      },
    };
  } catch (error: any) {
    return { success: false as const, error: error.message };
  }
}

export async function calculateOrderTotals(subtotal: number, state: string) {
  // Free shipping over ₹25,000, otherwise ₹500
  const shippingFee = subtotal > 25000 ? 0 : 500;

  // Tax calculation for Jewellery (usually 3% in India)
  // We define merchant state as Maharashtra for this example.
  const MERCHANT_STATE = "MAHARASHTRA";
  const userState = state.toUpperCase().trim();

  let cgst = 0,
    sgst = 0,
    igst = 0;
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
    total: subtotal + shippingFee + taxAmount,
  };
}
