import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { getOrderStatusSummary } from "@/lib/actions/checkout.actions";
import {
  PendingPaymentRefresh,
  SuccessCartClearer,
} from "./PendingPaymentRefresh";

/**
 * COD/Bank Transfer orders land here with nothing further to confirm — the
 * order itself IS the confirmation. Cashfree orders land here on redirect
 * from their hosted checkout, which is NOT proof of payment (the redirect
 * is client-controlled) — real confirmation comes from the webhook
 * (app/api/webhooks/cashfree/route.ts), so this looks up the order's
 * actual `paymentStatus` from the database rather than trusting arrival
 * at this URL alone.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; orderId?: string }>;
}) {
  const { order: orderNumber } = await searchParams;

  const result = orderNumber ? await getOrderStatusSummary(orderNumber) : null;
  const order = result?.success ? result.data : null;

  if (
    !order ||
    order.orderStatus === "CANCELLED" ||
    order.orderStatus === "RETURNED"
  ) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="font-display text-3xl font-bold text-plum-950">
          {!order ? "Order unavailable" : "This order is closed"}
        </h1>
        <p className="max-w-md text-plum-600">
          {order?.paymentStatus === "CONFIRMED"
            ? "We received a payment for a closed order. Please contact us so we can review fulfilment or a refund."
            : "Check your account for the latest order details before trying again."}
        </p>
        <Link href="/account/orders" className="text-plum-900 underline">
          View my orders
        </Link>
        <Link href="/contact" className="text-plum-900 underline">
          Contact us
        </Link>
      </div>
    );
  }

  const isGatewayOrder =
    order &&
    order.paymentMethod !== "COD" &&
    order.paymentMethod !== "BANK_TRANSFER";
  const isPending = isGatewayOrder && order.paymentStatus === "PENDING";
  const isFailed = isGatewayOrder && order.paymentStatus === "FAILED";

  if (isFailed) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex size-24 items-center justify-center bg-danger-50 shadow-sm ring-1 ring-danger-100">
          <XCircle className="size-12 text-danger-500" />
        </div>
        <h1 className="mb-4 font-display text-3xl font-bold text-plum-950">
          Payment Failed
        </h1>
        <p className="mx-auto mb-8 max-w-md text-plum-600">
          Your payment hasn&apos;t been confirmed. Check your bank and order
          status before retrying, or contact us if money was deducted.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/checkout"
            className="bg-gold-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-gold-600"
          >
            Try Again
          </Link>
          <Link
            href="/contact"
            className="border border-plum-200 bg-white px-6 py-2.5 font-medium text-plum-900 transition-colors hover:bg-plum-50"
          >
            Contact Us
          </Link>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <PendingPaymentRefresh />
        <div className="mb-6 flex size-24 items-center justify-center bg-gold-50 shadow-sm ring-1 ring-gold-100">
          <Clock className="size-12 animate-pulse text-gold-600" />
        </div>
        <h1 className="mb-4 font-display text-3xl font-bold text-plum-950">
          Confirming Your Payment
        </h1>
        <p className="mx-auto mb-2 max-w-md text-plum-600">
          This usually takes just a few seconds. This page will update
          automatically — no need to refresh or pay again.
        </p>
        {order && (
          <p className="mb-8 font-medium text-plum-900">
            Order Reference: #{order.orderNumber}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <SuccessCartClearer />
      <div className="mb-6 flex size-24 items-center justify-center bg-emerald-50 shadow-sm ring-1 ring-emerald-100">
        <CheckCircle2 className="size-12 text-emerald-500" />
      </div>
      <h1 className="mb-4 font-display text-3xl font-bold text-plum-950">
        Order Placed Successfully
      </h1>
      <p className="mx-auto mb-2 max-w-md text-plum-600">
        Thank you for your purchase! Your order has been placed and is currently
        being processed.
      </p>
      {order && (
        <p className="mb-8 font-medium text-plum-900">
          Order Reference: #{order.orderNumber}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/account/dashboard"
          className="bg-gold-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-gold-600"
        >
          View My Orders
        </Link>
        <Link
          href="/collections"
          className="border border-plum-200 bg-white px-6 py-2.5 font-medium text-plum-900 transition-colors hover:bg-plum-50"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
