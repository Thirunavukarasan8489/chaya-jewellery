import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models/order";
import { finalizeInventory } from "@/lib/inventory";
import { verifyCashfreeWebhookSignature } from "@/lib/services/cashfree";

/**
 * Cashfree payment webhook. Docs:
 * https://www.cashfree.com/docs/payments/online/webhooks/signature-verification
 * https://www.cashfree.com/docs/api-reference/payments/latest/payments/webhooks
 *
 * `data.order.order_id` is OUR `orderNumber` (that's what we sent Cashfree
 * as their order_id when creating the session in checkout.actions.ts), so
 * no separate gateway-order-id field is needed to find the order.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    // SECURITY: fail closed — an unset secret must never be treated as "no
    // verification needed". Same rule as the (now retired) Razorpay webhook.
    if (!process.env.CASHFREE_SECRET_KEY) {
      console.error("CASHFREE_SECRET_KEY is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const orderNumber: string | undefined = event?.data?.order?.order_id;
    if (!orderNumber) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      // Don't 4xx — Cashfree retries on non-2xx, and an order deleted after
      // the fact isn't something a retry can fix.
      return NextResponse.json({ received: true });
    }

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      if (order.paymentStatus !== "CONFIRMED") {
        const paymentStatus = event?.data?.payment?.payment_status;
        if (paymentStatus !== "SUCCESS") {
          return NextResponse.json({ received: true });
        }

        // SECURITY: a valid signature only proves the event came from
        // Cashfree — it says nothing about whether the amount PAID matches
        // what this order is actually for. Without this check, a genuinely
        // signed webhook for any Cashfree order could mark a full-price
        // order paid.
        const paidAmount = Number(event?.data?.order?.order_amount);
        const expectedAmount = Number(order.total);
        if (!Number.isFinite(paidAmount) || Math.round(paidAmount * 100) !== Math.round(expectedAmount * 100)) {
          console.error(
            `Cashfree webhook amount mismatch for order ${order.orderNumber}: paid ${paidAmount}, expected ${expectedAmount}`,
          );
          return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          order.paymentStatus = "CONFIRMED";
          order.orderStatus = "CONFIRMED";
          order.gatewayOrderId = event?.data?.payment_gateway_details?.gateway_order_id || undefined;
          order.gatewayPaymentId = event?.data?.payment?.cf_payment_id
            ? String(event.data.payment.cf_payment_id)
            : undefined;
          await order.save({ session });

          for (const item of order.items) {
            if (item.productId && item.variantId) {
              await finalizeInventory(item.productId.toString(), item.variantId, item.quantity, session);
            }
          }

          await session.commitTransaction();
          session.endSession();
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          throw err;
        }
      }
    } else if (
      event.type === "PAYMENT_FAILED_WEBHOOK" ||
      event.type === "PAYMENT_USER_DROPPED_WEBHOOK"
    ) {
      if (order.paymentStatus === "PENDING") {
        order.paymentStatus = "FAILED";
        await order.save();
        // Reserved stock isn't released here — the release-inventory cron
        // (app/api/cron/release-inventory) already sweeps any order still
        // PAYMENT_PENDING after 30 minutes, so a customer who retries
        // payment within that window doesn't lose their reservation.
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cashfree Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
