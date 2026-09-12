import { notFound } from 'next/navigation';
import { getLeadById } from '@/lib/actions/admin-leads';
import LeadDetailPanel from '@/components/admin/leads/LeadDetailPanel';
import LeadTimeline from '@/components/admin/leads/LeadTimeline';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await getLeadById(resolvedParams.id);
  
  if (!result.success || !result.data) {
    notFound();
  }
  
  const lead = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/leads" 
          className="p-2 rounded-full hover:bg-gold-200 dark:hover:bg-gold-800 text-gold-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Lead: {lead.customerName}</h1>
          <p className="text-sm text-gold-500 mt-1">Manage details and activities for this enquiry</p>
        </div>
      </div>

      <LeadDetailPanel lead={lead} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LeadTimeline leadId={lead._id.toString()} notes={lead.notes || []} />
        </div>
      </div>
    </div>
  );
}
