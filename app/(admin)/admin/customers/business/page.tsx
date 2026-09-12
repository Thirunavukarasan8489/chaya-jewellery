import { getCustomers } from "@/lib/actions/customer.actions";
import CustomersTable from "@/components/admin/customers/CustomersTable";

export const dynamic = "force-dynamic";

export default async function BusinessCustomersPage() {
  const result = await getCustomers("BUSINESS");
  const customers =
    result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-plum-950">
            Business Customers
          </h1>
          <p className="text-sm text-plum-600 mt-1">
            View and manage B2B and Wholesale customer profiles — {customers.length} customers
          </p>
        </div>
      </div>

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Failed to load business customers: {(result as any).error}
          </p>
        </div>
      )}

      <CustomersTable customers={customers} />
    </div>
  );
}
