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

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
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
