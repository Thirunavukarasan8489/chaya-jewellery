import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import { Order } from "@/lib/models/order";
import dbConnect from "@/lib/db";
import Link from "next/link";
import { ArrowRight, Package, TrendingUp } from "lucide-react";
import StatusBadge from "@/components/admin/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const session = await getServerSession(authOptions);
  
  await dbConnect();
  
  // Find customer profile linked to the user
  const customer = await Customer.findOne({ userId: (session?.user as any)?.id }).lean();
  let recentOrders: any[] = [];
  
  if (customer && customer.contact?.phone) {
    recentOrders = await Order.find({ phone: customer.contact.phone })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-plum-900 to-plum-800 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-lg shadow-plum-900/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gold-400/20 blur-3xl mix-blend-screen"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Customer'}!
          </h1>
          <p className="mt-2 text-plum-200 max-w-lg">
            Manage your recent orders, update your shipping addresses, and explore the latest gemstone collections all from your personalized dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/collections" className="bg-gold-500 hover:bg-gold-400 text-plum-950 font-semibold px-6 py-2.5 rounded-xl transition-colors inline-flex items-center gap-2">
              Explore Collections
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border border-plum-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-plum-500">Total Orders</p>
            <p className="text-2xl font-bold text-plum-900">{customer?.metrics?.totalOrders || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-plum-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-50 text-gold-500 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-plum-500">Total Spent</p>
            <p className="text-2xl font-bold text-plum-900">
              ₹{(customer?.metrics?.totalSpend || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-plum-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-plum-100">
          <h2 className="text-lg font-semibold text-plum-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-gold-600 hover:text-gold-500">
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
                  <tr key={order._id.toString()} className="hover:bg-plum-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-plum-900">
                      #{order._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ₹{(order.total || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge 
                        label={order.status.replace(/_/g, ' ')} 
                        variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'neutral'} 
                      />
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
            <p className="mt-1 text-sm text-plum-500">When you place an order, it will show up here.</p>
            <Link href="/collections" className="mt-6 inline-block bg-plum-100 hover:bg-plum-200 text-plum-700 font-medium px-5 py-2 rounded-lg transition-colors">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
