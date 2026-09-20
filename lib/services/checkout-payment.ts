import mongoose from "mongoose";
import { Order } from "@/lib/models/order";
import { Payment } from "@/lib/models/payment";
import { finalizeInventory, releaseInventory } from "@/lib/inventory";
import {
  cashfreeOrderMatchesCheckout,
  fetchCashfreeOrder,
  fetchCashfreePayments,
  type CashfreeOrder,
  type CashfreePayment,
} from "@/lib/services/cashfree";

export const isOnlinePayment = (method: string) =>
  ["UPI", "CARD", "NET_BANKING"].includes(method);
export const checkoutPaymentNumber = (orderId: unknown) =>
  `PAY_${String(orderId)}`;

/** One checkout payment per purchase. Also lazily supplies missing legacy rows. */
export async function ensureCheckoutPayment(
  order: any,
  session?: mongoose.ClientSession,
) {
  return Payment.findOneAndUpdate(
    { paymentNumber: checkoutPaymentNumber(order._id) },
    {
      $setOnInsert: {
        orderId: order._id,
        source: "CHECKOUT",
        provider: isOnlinePayment(order.paymentMethod) ? "CASHFREE" : "OFFLINE",
        method: order.paymentMethod,
        amount: order.total,
        currency: "INR",
        status: order.paymentStatus === "CONFIRMED" ? "COMPLETED" : "PENDING",
      },
    },
    { upsert: true, returnDocument: "after", session, runValidators: true },
  ).select("+cashfree");
}

export function expectedCashfreeCheckout(order: any) {
  return {
    orderId: order.cashfreeOrderId || order.orderNumber,
    amount: order.total,
    customerEmail: order.email,
    customerPhone: order.phone,
    createdAt: order.cashfreeOrderId ? undefined : order.createdAt,
  };
}

type GatewayProof = {
  merchantId: string;
  gatewayOrder?: CashfreeOrder;
  payments: CashfreePayment[];
  webhook?: unknown;
};

function paymentMatches(
  payment: CashfreePayment,
  order: any,
  merchantId: string,
) {
  return (
    !!payment.cf_payment_id &&
    (!payment.order_id || payment.order_id === merchantId) &&
    payment.payment_currency === "INR" &&
    Number.isFinite(payment.payment_amount) &&
    Math.round(payment.payment_amount * 100) === Math.round(order.total * 100)
  );
}

/** Internal only: callers obtain proof from authenticated Cashfree APIs/webhooks. */
async function applyGatewayProof(localOrderId: string, proof: GatewayProof) {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const order = await Order.findById(localOrderId).session(session);
      if (!order || !isOnlinePayment(order.paymentMethod))
        throw new Error("Online order not found.");
      if ((order.cashfreeOrderId || order.orderNumber) !== proof.merchantId) {
        throw new Error("The payment ID no longer belongs to this checkout.");
      }
      for (const attempt of proof.payments) {
        if (!paymentMatches(attempt, order, proof.merchantId))
          throw new Error("Payment details mismatch.");
      }

      const payment = await ensureCheckoutPayment(order, session);
      const gateway = payment.cashfree || {};
      gateway.orderId = proof.merchantId;
      gateway.verifiedAt = new Date();
      if (proof.gatewayOrder) {
        gateway.lastOrderResponse = proof.gatewayOrder;
        gateway.cfOrderId = String(proof.gatewayOrder.cf_order_id);
      }
      if (proof.webhook) gateway.lastWebhook = proof.webhook;
      const attempts: CashfreePayment[] = gateway.attempts || [];
      for (const incoming of proof.payments) {
        const index = attempts.findIndex(
          (item) =>
            String(item.cf_payment_id) === String(incoming.cf_payment_id),
        );
        if (index < 0) attempts.push(incoming);
        else if (attempts[index].payment_status !== "SUCCESS")
          attempts[index] = incoming;
      }
      gateway.attempts = attempts;
      const successful = attempts.find(
        (item) => item.payment_status === "SUCCESS",
      );
      const paid = !!successful || proof.gatewayOrder?.order_status === "PAID";

      if (paid) {
        payment.status = "COMPLETED";
        if (successful)
          payment.transactionId = String(successful.cf_payment_id);
        const canFulfil = order.orderStatus === "PAYMENT_PENDING";
        const claimed = await Order.findOneAndUpdate(
          { _id: order._id, paymentStatus: { $ne: "CONFIRMED" } },
          {
            $set: {
              paymentStatus: "CONFIRMED",
              orderStatus: canFulfil ? "CONFIRMED" : order.orderStatus,
              cashfreeOrderId: proof.merchantId,
              ...(gateway.cfOrderId
                ? { gatewayOrderId: gateway.cfOrderId }
                : {}),
              ...(successful
                ? { gatewayPaymentId: String(successful.cf_payment_id) }
                : {}),
            },
          },
          { returnDocument: "after", session },
        );
        if (claimed && canFulfil) {
          for (const item of order.items) {
            await finalizeInventory(
              String(item.productId),
              item.variantId,
              item.quantity,
              session,
            );
          }
        } else if (claimed) {
          // Record the money without reviving an expired/cancelled purchase.
          payment.requiresReview = true;
          payment.notes =
            "Payment received after the order left checkout. Review fulfilment or refund.";
        }
        order.paymentStatus = "CONFIRMED";
        if (claimed && canFulfil) order.orderStatus = "CONFIRMED";
      } else if (
        !["COMPLETED", "REFUNDED"].includes(payment.status) &&
        order.paymentStatus !== "CONFIRMED"
      ) {
        const pending = attempts.some((item) =>
          ["PENDING", "NOT_ATTEMPTED"].includes(item.payment_status),
        );
        const terminal = ["EXPIRED", "TERMINATED"].includes(
          proof.gatewayOrder?.order_status || "",
        );
        const failed =
          terminal ||
          (!pending &&
            attempts.some((item) =>
              ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(
                item.payment_status,
              ),
            ));
        payment.status = failed ? "FAILED" : "PENDING";
        order.paymentStatus = payment.status;
        order.cashfreeOrderId = proof.merchantId;
        await order.save({ session });
      }

      payment.cashfree = gateway;
      payment.markModified("cashfree");
      await payment.save({ session });
      return {
        success: true as const,
        paymentStatus: String(order.paymentStatus),
        orderStatus: String(order.orderStatus),
        requiresReview: !!payment.requiresReview,
      };
    });
  } finally {
    await session.endSession();
  }
}

/** Used by the SDK return path, account views and the expiry job. */
export async function reconcileCashfreePayment(localOrderId: string) {
  const order = await Order.findById(localOrderId);
  if (!order || !isOnlinePayment(order.paymentMethod))
    throw new Error("Online order not found.");
  const expected = expectedCashfreeCheckout(order);
  const gatewayOrder = await fetchCashfreeOrder(expected.orderId);
  if (!gatewayOrder)
    return {
      success: false as const,
      error: "Payment has not been initiated.",
    };
  if (!cashfreeOrderMatchesCheckout(gatewayOrder, expected)) {
    throw new Error("The gateway payment does not belong to this order.");
  }
  const payments = await fetchCashfreePayments(expected.orderId);
  return applyGatewayProof(String(order._id), {
    merchantId: expected.orderId,
    gatewayOrder,
    payments,
  });
}

/** Signature verification happens in the route, before this function is called. */
export async function processCashfreeWebhook(event: any) {
  if (
    ![
      "PAYMENT_SUCCESS_WEBHOOK",
      "PAYMENT_FAILED_WEBHOOK",
      "PAYMENT_USER_DROPPED_WEBHOOK",
    ].includes(event?.type)
  )
    return;
  const merchantId = event?.data?.order?.order_id;
  if (typeof merchantId !== "string" || !merchantId)
    throw new Error("Missing order_id.");
  const order = await Order.findOne({
    $or: [
      { cashfreeOrderId: merchantId },
      { orderNumber: merchantId, cashfreeOrderId: null },
    ],
  });
  if (!order || !isOnlinePayment(order.paymentMethod)) return;

  const expected = expectedCashfreeCheckout(order);
  let gatewayOrder: CashfreeOrder | undefined;
  if (!order.cashfreeOrderId) {
    const legacy = await fetchCashfreeOrder(merchantId);
    if (!legacy || !cashfreeOrderMatchesCheckout(legacy, expected)) return;
    gatewayOrder = legacy;
  }
  if (
    !cashfreeOrderMatchesCheckout(
      { ...event.data.order, customer_details: event.data.customer_details },
      {
        ...expected,
        createdAt: undefined,
      },
    )
  )
    throw new Error("Payment details mismatch.");
  const incoming = event.data.payment as CashfreePayment;
  const allowedStatus: Record<string, string[]> = {
    PAYMENT_SUCCESS_WEBHOOK: ["SUCCESS"],
    PAYMENT_FAILED_WEBHOOK: ["FAILED"],
    PAYMENT_USER_DROPPED_WEBHOOK: ["USER_DROPPED"],
  };
  if (!allowedStatus[event.type].includes(incoming?.payment_status))
    throw new Error("Invalid payment event.");
  return applyGatewayProof(String(order._id), {
    merchantId,
    gatewayOrder,
    payments: [incoming],
    webhook: event,
  });
}

/** Release only after Cashfree can no longer accept payment for this order. */
export async function expireCashfreeCheckout(localOrderId: string) {
  const order = await Order.findById(localOrderId);
  if (
    !order ||
    !isOnlinePayment(order.paymentMethod) ||
    order.orderStatus !== "PAYMENT_PENDING" ||
    order.paymentStatus === "CONFIRMED"
  )
    return false;
  const deadline =
    order.reservationExpiresAt ||
    new Date(order.createdAt.getTime() + 30 * 60 * 1000);
  if (deadline.getTime() > Date.now()) return false;
  const expected = expectedCashfreeCheckout(order);
  const remote = await fetchCashfreeOrder(expected.orderId);
  if (remote && cashfreeOrderMatchesCheckout(remote, expected)) {
    if (remote.order_status === "PAID") {
      await reconcileCashfreePayment(localOrderId);
      return false;
    }
    // An ACTIVE legacy session may outlive our reservation window. Keep its
    // reservation until the gateway confirms expiry/termination.
    if (!["EXPIRED", "TERMINATED"].includes(remote.order_status)) return false;
  }

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const cancelled = await Order.findOneAndUpdate(
        {
          _id: order._id,
          orderStatus: "PAYMENT_PENDING",
          paymentStatus: { $ne: "CONFIRMED" },
          cashfreeOrderId: order.cashfreeOrderId || null,
        },
        { $set: { orderStatus: "CANCELLED", paymentStatus: "FAILED" } },
        { returnDocument: "after", session },
      );
      if (!cancelled) return false;
      const payment = await ensureCheckoutPayment(cancelled, session);
      if (payment.status === "COMPLETED")
        throw new Error(
          "A completed payment requires reconciliation before expiry.",
        );
      payment.status = "FAILED";
      payment.notes = "Checkout expired before payment completed.";
      await payment.save({ session });
      for (const item of cancelled.items) {
        await releaseInventory(
          String(item.productId),
          item.variantId,
          item.quantity,
          session,
        );
      }
      return true;
    });
  } finally {
    await session.endSession();
  }
}
