import { getAuditLogs } from '@/lib/actions/audit.actions';

export const dynamic = 'force-dynamic';

export default async function SystemAuditPage() {
  const result = await getAuditLogs();
  const logs = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-800">System Audit Logs</h1>
      </div>

      <div className="bg-white border border-gold-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gold-50 border-b border-gold-200 text-gold-600">
            <tr>
              <th className="px-6 py-3 font-medium">Log ID</th>
              <th className="px-6 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">Performed By</th>
              <th className="px-6 py-3 font-medium">Entity</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gold-500">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log._id} className="hover:bg-gold-50">
                  <td className="px-6 py-4 font-medium text-gold-900">{log._id.toString().substring(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gold-100 text-gold-700 rounded text-xs font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gold-600">
                    {log.performedBy?.name || 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 text-gold-600">
                    {log.entity} {log.entityId ? `(${log.entityId.toString().substring(0, 8)})` : ''}
                  </td>
                  <td className="px-6 py-4 text-gold-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gold-600 hover:text-gold-800 font-medium">View Diff</button>
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
