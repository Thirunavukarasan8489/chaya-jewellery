import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import { Order } from "@/lib/models/order";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "@/components/admin/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();

  const userId = (session.user as any)?.id;
  const userEmail = session.user?.email;

  let customer = await Customer.findOne({ userId }).lean();
  if (!customer && userEmail) {
    customer = await Customer.findOne({ "contact.email": userEmail }).lean();
  }

  const orderConditions: any[] = [];
  if (customer?.contact?.phone) {
    orderConditions.push({ phone: customer.contact.phone });
  }
  if (userEmail) {
    orderConditions.push({ email: userEmail });
  }
  if (customer?.contact?.email && customer.contact.email !== userEmail) {
    orderConditions.push({ email: customer.contact.email });
  }

  const orders =
    orderConditions.length > 0
      ? await Order.find({ $or: orderConditions }).sort({ createdAt: -1 }).lean()
      : [];

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="bg-white rounded-2xl border border-plum-100 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-plum-950">
            Order History
          </h1>
          <p className="text-sm text-plum-600 mt-1">
            Track and review your past purchases and delivery statuses.
          </p>
        </div>
        {orders.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plum-50 border border-plum-100 text-xs font-semibold text-plum-800">
            <Package size={14} className="text-gold-500" />
            <span>{orders.length} Total Orders</span>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-plum-100 p-12 sm:p-16 shadow-sm text-center">
          <div className="size-16 rounded-2xl bg-plum-50 text-gold-500 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-xl font-bold font-display text-plum-950">
            No orders found
          </h2>
          <p className="mt-2 text-sm text-plum-500 max-w-md mx-auto leading-relaxed">
            You haven&apos;t placed any orders with us yet. Explore our handcrafted
            fine jewellery collections to find your signature piece.
          </p>
          <div className="mt-8">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-xl bg-plum-900 px-6 py-3 text-sm font-semibold text-gold-400 hover:bg-plum-800 transition-all shadow-md shadow-plum-900/10"
            >
              <span>Explore Collections</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-6">
          {orders.map((order: any) => {
            const orderDate = new Date(order.createdAt).toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            );
            const orderNum =
              order.orderNumber || order._id.toString().slice(-8).toUpperCase();
            const items = order.items || [];
            const shipping = order.shippingAddress || {};

            return (
              <div
                key={order._id.toString()}
                className="bg-white rounded-2xl border border-plum-100 shadow-sm overflow-hidden hover:border-plum-200 transition-all"
              >
                {/* Order Card Header */}
                <div className="p-5 sm:p-6 bg-plum-50/40 border-b border-plum-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-medium text-plum-400 block">
                        Order Number
                      </span>
                      <span className="font-bold text-plum-950 text-base">
                        #{orderNum}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-plum-200/60" />

                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-medium text-plum-400 block">
                        Date Placed
                      </span>
                      <span className="text-sm font-medium text-plum-700 flex items-center gap-1.5">
                        <Calendar size={13} className="text-plum-400" />
                        {orderDate}
                      </span>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-plum-200/60" />

                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-medium text-plum-400 block">
                        Total Amount
                      </span>
                      <span className="font-bold text-plum-950 text-base">
                        ₹{(order.total || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={order.orderStatus?.replace(/_/g, " ")}
                      status={order.orderStatus}
                    />
                    <StatusBadge
                      label={`Pay: ${order.paymentStatus?.replace(/_/g, " ")}`}
                      status={order.paymentStatus}
                    />
                  </div>
                </div>

                {/* Order Items List */}
                <div className="p-5 sm:p-6 divide-y divide-plum-50">
                  {items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-xl bg-plum-50 border border-plum-100 flex items-center justify-center shrink-0 text-gold-500 shadow-inner">
                          <Package size={22} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-plum-900 text-sm sm:text-base">
                            {item.name}
                          </h4>
                          <div className="text-xs text-plum-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            <span>Qty: {item.quantity}</span>
                            <span>
                              Price: ₹{(item.price || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:text-right">
                        <span className="text-xs text-plum-400 sm:hidden">
                          Item Total:{" "}
                        </span>
                        <span className="font-bold text-plum-950 text-sm sm:text-base">
                          ₹
                          {(
                            (item.price || 0) * (item.quantity || 1)
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery & Summary Footer */}
                <div className="p-5 sm:p-6 bg-plum-50/20 border-t border-plum-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-plum-600">
                    {shipping.street && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-plum-400 shrink-0" />
                        <span className="truncate max-w-xs">
                          {shipping.street}, {shipping.city} ({shipping.pincode})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={14} className="text-plum-400 shrink-0" />
                      <span>{order.paymentMethod || "Online Payment"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/track-order`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-plum-200 text-plum-800 font-semibold hover:bg-plum-50 hover:border-plum-300 transition-colors"
                    >
                      <span>Track Order</span>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
