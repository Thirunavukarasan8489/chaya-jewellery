import { getOrderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { ProcessingCard } from "@/components/admin/orders/processing-card";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, User, MapPin, CreditCard, FileText, Package } from "lucide-react";

export const metadata = {
  title: "Order Details - Chaya Jewellery Admin",
};

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const res = await getOrderById(params.id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const order = res.data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 bg-slate-100 dark:bg-plum-800 hover:bg-slate-200 dark:hover:bg-plum-700 rounded-none transition-colors text-slate-600 dark:text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-plum-900 dark:text-ivory-100 flex items-center gap-3">
              Order {order.orderNumber}
              <StatusBadge status={order.orderStatus} />
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Processing Card */}
          <ProcessingCard orderId={order._id} currentStatus={order.orderStatus} />

          {/* Order Items */}
          <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 bg-slate-50 dark:bg-plum-950/50 flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">Order Items</h2>
            </div>
            <div className="p-6">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-plum-800">
                  <tr>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium text-center">Quantity</th>
                    <th className="pb-3 font-medium text-right">Unit Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-plum-800/50">
                  {order.items.map((item: any, idx: number) => {
                    // Must mirror the lineTotal math in checkout.actions.ts —
                    // a variant-value priced line (e.g. price per carat) needs
                    // price * quantity * variantValue, not just price * quantity.
                    const lineTotal =
                      item.calculatePriceOnVariantValue && item.variantValue
                        ? item.price * item.quantity * item.variantValue
                        : item.price * item.quantity;

                    return (
                    <tr key={idx}>
                      <td className="py-4">
                        <div className="font-medium text-plum-900 dark:text-ivory-100">{item.name}</div>
                        {item.sku && <div className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.sku}</div>}
                      </td>
                      <td className="py-4 text-center text-slate-700 dark:text-slate-300">{item.quantity}</td>
                      <td className="py-4 text-right text-slate-700 dark:text-slate-300">₹{item.price.toLocaleString("en-IN")}</td>
                      <td className="py-4 text-right font-medium text-plum-900 dark:text-ivory-100">₹{lineTotal.toLocaleString("en-IN")}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-plum-800 flex flex-col items-end space-y-2 text-sm">
                <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                  <span>Shipping Fee</span>
                  <span>{order.shippingFee === 0 ? "Free" : `₹${order.shippingFee}`}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600 dark:text-slate-300">
                  <span>Estimated Tax</span>
                  <span>₹{order.tax?.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between w-64 text-lg font-bold text-plum-900 dark:text-ivory-100 pt-2 border-t border-gray-200 dark:border-plum-800 mt-2">
                  <span>Total</span>
                  <span>₹{order.total?.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 bg-slate-50 dark:bg-plum-950/50 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">Customer</h2>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <p className="font-medium text-plum-900 dark:text-ivory-100">{order.customerName}</p>
                <p className="text-slate-600 dark:text-slate-300">{order.email}</p>
                <p className="text-slate-600 dark:text-slate-300">{order.phone}</p>
              </div>
              <div>
                <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-plum-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium uppercase">
                  {order.purchaseType || 'PERSONAL'} PURCHASE
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 bg-slate-50 dark:bg-plum-950/50 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">Payment Details</h2>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Method</span>
                <span className="font-medium text-plum-900 dark:text-ivory-100">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.gatewayPaymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
                  <span className="font-mono text-xs text-plum-900 dark:text-ivory-100">{order.gatewayPaymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 bg-slate-50 dark:bg-plum-950/50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">Shipping Address</h2>
            </div>
            <div className="p-6 text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-medium text-plum-900 dark:text-ivory-100">{order.shippingAddress?.fullName || order.customerName}</p>
              <p>{order.shippingAddress?.street}</p>
              {order.shippingAddress?.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              <p>{order.shippingAddress?.country || "India"}</p>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-plum-900 border border-gray-200 dark:border-plum-800 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-plum-800 bg-slate-50 dark:bg-plum-950/50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-plum-900 dark:text-ivory-100">Notes</h2>
              </div>
              <div className="p-6 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {order.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple icon for Package since it might conflict with lucide's Package
function PackageIcon(props: any) {
  return <Package {...props} />;
}
