import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models/order";
import { finalizeInventory } from "@/lib/inventory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature found" }, { status: 400 });
    }

    // SECURITY: fail closed instead of defaulting to "" — an unset secret
    // used to make the HMAC key a known, empty string, letting anyone
    // compute a valid signature for a forged payment.captured event.
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    // Constant-time compare — a plain !== leaks timing information on a
    // payment-integrity check.
    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);
    const signatureValid =
      expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
    if (!signatureValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    await dbConnect();

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      // Find the order with this razorpayOrderId
      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.paymentStatus !== "COMPLETED") {
        // SECURITY: a valid signature only proves the event came from
        // Razorpay — it says nothing about whether the amount PAID matches
        // what this order is actually for. Without this check, a genuinely
        // signed webhook for any Razorpay order (e.g. one created for a
        // near-zero amount elsewhere) could mark a full-price order paid.
        const paidAmountPaise = Number(payment.amount);
        const expectedAmountPaise = Math.round(Number(order.total) * 100);
        if (!Number.isFinite(paidAmountPaise) || paidAmountPaise !== expectedAmountPaise) {
          console.error(
            `Razorpay webhook amount mismatch for order ${order.orderNumber}: paid ${paidAmountPaise}, expected ${expectedAmountPaise}`,
          );
          return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          order.paymentStatus = "COMPLETED";
          order.orderStatus = "CONFIRMED";
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
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
