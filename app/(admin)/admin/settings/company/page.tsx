import { Metadata } from 'next';
import { getSettings } from '@/lib/actions/settings.actions';
import CompanySettingsForm from '@/components/admin/settings/CompanySettingsForm';
import { Settings as SettingsIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Company Settings | Admin',
};

export default async function CompanySettingsPage() {
  const { data: settings } = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-plum-900 dark:text-ivory-100">
          <SettingsIcon size={24} className="text-gold-500" />
          <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        </div>
        <p className="text-sm text-plum-600 dark:text-plum-300 ml-8">
          Manage your global business details, support contacts, and social media links.
        </p>
      </div>
      
      <div className="">
        <CompanySettingsForm initialData={settings || {}} />
      </div>
    </div>
  );
}
