import React from 'react';

export const dynamic = 'force-dynamic';

export default function LeadsAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Lead Analytics</h1>
          <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
            Track and analyze lead conversion performance
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gold-800 p-6 rounded-xl border border-gold-200 dark:border-gold-700">
        <p className="text-gold-500 dark:text-gold-400">
          Analytics dashboard coming soon.
        </p>
      </div>
    </div>
  );
}
