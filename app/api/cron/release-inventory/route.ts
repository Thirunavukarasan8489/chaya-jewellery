import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Order } from "@/lib/models/order";
import { expireCashfreeCheckout } from "@/lib/services/checkout-payment";

export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    await dbConnect();
    const expiredOrders = await Order.find({
      orderStatus: "PAYMENT_PENDING",
      paymentStatus: { $ne: "CONFIRMED" },
      paymentMethod: { $in: ["UPI", "CARD", "NET_BANKING"] },
      createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
    }).select("_id");
    let processed = 0;
    for (const order of expiredOrders) {
      try {
        if (await expireCashfreeCheckout(String(order._id))) processed++;
      } catch (error) {
        // Unknown gateway state must retain stock; a later run can retry.
        console.error(`Unable to expire checkout ${order._id}:`, error);
      }
    }
    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error("Checkout expiry failed:", error);
    return NextResponse.json(
      { success: false, error: "Checkout expiry failed" },
      { status: 500 },
    );
  }
}
