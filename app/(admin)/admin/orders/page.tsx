import { getOrders } from '@/lib/actions/order.actions';
import OrdersTable from '@/components/admin/orders/OrdersTable';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const result = await getOrders();
  const orders = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Orders</h1>
          <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
            Manage customer orders and processing — {orders.length} total
          </p>
        </div>
      </div>

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Failed to load orders: {(result as any).error}
          </p>
        </div>
      )}

      <OrdersTable orders={orders} />
    </div>
  );
}
