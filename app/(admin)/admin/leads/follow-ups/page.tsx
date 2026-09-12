import { getLeads } from '@/lib/actions/admin-leads';
import LeadsTableClient from '@/components/admin/leads/LeadsTableClient';
import { LeadType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function FollowUpsPage() {
  // Only fetch leads with FOLLOW_UP status
  const result = await getLeads({ status: 'FOLLOW_UP' });
  const leads: LeadType[] = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Follow-ups</h1>
          <p className="text-sm text-gold-500 mt-1">Leads that require follow-up actions</p>
        </div>
      </div>

      {result.success === false && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200 text-sm">
          Failed to load follow-ups: {result.error}
        </div>
      )}

      <LeadsTableClient title="Pending Follow-ups" data={leads} />
    </div>
  );
}
