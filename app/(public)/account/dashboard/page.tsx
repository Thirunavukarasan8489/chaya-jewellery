import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import { Order } from "@/lib/models/order";
import dbConnect from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Package, TrendingUp } from "lucide-react";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { finalizeCashfreePayment } from "@/lib/actions/checkout.actions";
import { BackButton } from "@/components/public/ui/back-button";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const session = await getServerSession(authOptions);

  await dbConnect();

  const userId = (session?.user as any)?.id;
  const userEmail = session?.user?.email;

  // 1. Resolve or initialize Customer Profile strictly by userId and email
  let customer = null;
  if (userId) {
    customer = await Customer.findOne({ userId });
  }
  if (!customer && userEmail) {
    customer = await Customer.findOne({ "contact.email": userEmail });
    if (customer && userId && !customer.userId) {
      customer.userId = userId;
      await customer.save();
    }
  }

  // Auto-initialize customer profile if it doesn't exist yet
  if (!customer && (userId || userEmail)) {
    const fullName = session?.user?.name || "Customer";
    const nameParts = fullName.trim().split(" ");
    customer = await Customer.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      type: "PERSONAL",
      contact: { email: userEmail || "" },
      profile: {
        firstName: nameParts[0] || "Customer",
        lastName: nameParts.slice(1).join(" ") || "",
      },
      addresses: [],
      metrics: { totalOrders: 0, totalSpend: 0 },
    });
  }

  // Strictly scope orders to authenticated user identity — NEVER match by phone alone!
  const orderConditions: any[] = [];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    orderConditions.push({ userId: new mongoose.Types.ObjectId(userId) });
  }
  if (userEmail) {
    orderConditions.push({ email: userEmail });
  }

  let recentOrders: any[] = [];
  let totalOrdersCount = 0;
  let totalSpendAmount = 0;

  if (orderConditions.length > 0) {
    // 1. Reconcile any PENDING online orders with Cashfree in real time
    const pendingGatewayOrders = await Order.find({
      $or: orderConditions,
      paymentStatus: "PENDING",
      paymentMethod: { $nin: ["COD", "BANK_TRANSFER"] },
    })
      .select("orderNumber")
      .lean();

    for (const po of pendingGatewayOrders) {
      await finalizeCashfreePayment(po.orderNumber);
    }

    // 2. Fetch fresh matching orders strictly for this user
    const matchingOrders = await Order.find({ $or: orderConditions })
      .sort({ createdAt: -1 })
      .lean();

    recentOrders = matchingOrders.slice(0, 5);
    totalOrdersCount = matchingOrders.length;
    // Total spent is the sum of paid / confirmed orders
    totalSpendAmount = matchingOrders
      .filter((o: any) => o.paymentStatus === "CONFIRMED" || o.orderStatus === "CONFIRMED")
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    // Sync corrected metrics directly to customer in DB
    if (customer && (customer as any)._id) {
      await Customer.findByIdAndUpdate((customer as any)._id, {
        $set: {
          "metrics.totalOrders": totalOrdersCount,
          "metrics.totalSpend": totalSpendAmount,
        },
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <BackButton fallbackHref="/" label="Back to Home" />
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-plum-900 to-plum-800 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-lg shadow-plum-900/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-none bg-gold-400/20 blur-3xl mix-blend-screen"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0] || "Customer"}!
          </h1>
          <p className="mt-2 text-plum-200 max-w-lg">
            Manage your recent orders, update your shipping addresses, and
            explore our handcrafted fine jewellery collections all from your
            personalized dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/collections"
              className="bg-gold-500 hover:bg-gold-400 text-plum-950 font-semibold px-6 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              Explore Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border border-plum-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-plum-500">Total Orders</p>
            <p className="text-2xl font-bold text-plum-900">
              {totalOrdersCount}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-plum-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-plum-500">Total Spent</p>
            <p className="text-2xl font-bold text-plum-900">
              ₹{totalSpendAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-plum-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-plum-100">
          <h2 className="text-lg font-semibold text-plum-900">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm font-medium text-gold-600 hover:text-gold-500"
          >
            View All
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-plum-600">
              <thead className="bg-plum-50/50 text-xs font-semibold uppercase tracking-wider text-plum-500 border-b border-plum-100">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum-50">
                {recentOrders.map((order: any) => (
                  <tr
                    key={order._id.toString()}
                    className="hover:bg-plum-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-plum-900">
                      #{order.orderNumber || order._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ₹{(order.total || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge
                          status={order.orderStatus}
                          label={order.orderStatus?.replace(/_/g, " ")}
                        />
                        <StatusBadge
                          status={order.paymentStatus}
                          label={`Pay: ${order.paymentStatus?.replace(/_/g, " ")}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-plum-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-plum-900">No orders yet</h3>
            <p className="mt-1 text-sm text-plum-500">
              When you place an order, it will show up here.
            </p>
            <Link
              href="/collections"
              className="mt-6 inline-block bg-plum-100 hover:bg-plum-200 text-plum-700 font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
