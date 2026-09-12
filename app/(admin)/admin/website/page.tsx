import { AdminButton } from '@/components/admin/ui/AdminButton';

export default function WebsiteCMSPage() {
  const sections = [
    { id: '1', type: 'HERO', enabled: true, order: 1 },
    { id: '2', type: 'TRUST_HIGHLIGHTS', enabled: true, order: 2 },
    { id: '3', type: 'FEATURED_CATEGORIES', enabled: true, order: 3 },
    { id: '4', type: 'PROMO_BANNER', enabled: false, order: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-800">Homepage CMS</h1>
        <AdminButton>Save Changes</AdminButton>
      </div>

      <div className="bg-white border border-gold-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gold-800 mb-4 pb-2 border-b">Announcement Bar</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded border-gold-300 text-gold-600 focus:ring-gold-500" />
            <span className="text-sm font-medium text-gold-700">Enabled</span>
          </label>
          <input type="text" defaultValue="Free Shipping on all orders above ₹10,000" className="flex-1 border border-gold-300 rounded-md p-2 text-sm" />
        </div>
      </div>

      <div className="bg-white border border-gold-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gold-800 mb-4 pb-2 border-b">Section Ordering</h2>
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="flex items-center justify-between p-4 border border-gold-200 rounded-md bg-gold-50">
              <div className="flex items-center space-x-4">
                <span className="text-gold-400 cursor-move">⋮⋮</span>
                <span className="font-medium text-gold-700">{section.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked={section.enabled} className="rounded border-gold-300 text-gold-600 focus:ring-gold-500" />
                  <span className="text-sm text-gold-600">Enabled</span>
                </label>
                <AdminButton variant="ghost" size="sm">Edit Config</AdminButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
