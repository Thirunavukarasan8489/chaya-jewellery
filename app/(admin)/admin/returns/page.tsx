import { getReturns } from '@/lib/actions/return.actions';

export const dynamic = 'force-dynamic';

export default async function ReturnsPage() {
  const result = await getReturns();
  const returns = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-800">Returns Management</h1>
      </div>

      <div className="bg-white border border-gold-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gold-50 border-b border-gold-200 text-gold-600">
            <tr>
              <th className="px-6 py-3 font-medium">Return ID</th>
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Reason</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-100">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gold-500">
                  No return requests found.
                </td>
              </tr>
            ) : (
              returns.map((ret: any) => (
                <tr key={ret._id} className="hover:bg-gold-50">
                  <td className="px-6 py-4 font-medium text-gold-900">{ret.returnNumber}</td>
                  <td className="px-6 py-4 text-gold-600">
                    {ret.orderId?.orderNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gold-600">
                    {ret.customerInfo?.name || ret.orderId?.customerName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gold-600">{ret.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      ret.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      ret.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      ret.status === 'REFUNDED' ? 'bg-gold-100 text-gold-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gold-500">
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gold-600 hover:text-gold-800 font-medium">Review</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
