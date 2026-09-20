import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyCashfreeWebhookSignature } from "@/lib/services/cashfree";
import { processCashfreeWebhook } from "@/lib/services/checkout-payment";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";
    if (!process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 },
      );
    }
    if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    const event = JSON.parse(rawBody);
    if (!event?.data?.order?.order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }
    await dbConnect();
    await processCashfreeWebhook(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cashfree webhook failed:", error);
    // A non-2xx response lets Cashfree retry a failed database transaction.
    return NextResponse.json(
      { error: "Unable to process payment event" },
      { status: 500 },
    );
  }
}
