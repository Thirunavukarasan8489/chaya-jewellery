import { Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return (
    <div className="bg-white rounded-2xl border border-plum-100 p-8 shadow-sm text-center">
      <Package className="w-12 h-12 text-plum-200 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-plum-900">Order History</h2>
      <p className="mt-2 text-plum-500 max-w-md mx-auto">
        Your order history will appear here once you make your first purchase. We are currently building this section!
      </p>
    </div>
  );
}
