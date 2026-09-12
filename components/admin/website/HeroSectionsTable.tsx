'use client';

import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { deleteHeroSection } from '@/lib/actions/cms.actions';
import DeleteConfirmButton from '@/components/admin/ui/DeleteConfirmButton';

type HeroSectionRow = {
  _id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export default function HeroSectionsTable({ sections }: { sections: HeroSectionRow[] }) {
  const columns = [
    {
      header: 'Section Name',
      cell: (item: HeroSectionRow) => (
        <span className="font-medium text-gold-800 dark:text-gold-200">{item.name}</span>
      ),
    },
    {
      header: 'Order',
      cell: (item: HeroSectionRow) => (
        <span className="text-gold-600 dark:text-gold-400">{item.displayOrder}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item: HeroSectionRow) => (
        <StatusBadge 
          label={item.isActive ? 'ACTIVE' : 'INACTIVE'} 
          variant={item.isActive ? 'success' : 'neutral'} 
        />
      ),
    },
    {
      header: 'Last Updated',
      cell: (item: HeroSectionRow) => (
        <span className="text-gold-500 dark:text-gold-400 text-sm">
          {new Date(item.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item: HeroSectionRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/website/hero-section/${item._id}/edit`}
            className="p-1 text-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
          >
            <Edit size={16} />
          </Link>
          <DeleteConfirmButton 
            entityId={item._id} 
            entityName={item.name} 
            deleteAction={deleteHeroSection} 
          />
        </div>
      ),
    },
  ];

  return <DataTable title="Hero Sections" columns={columns} data={sections} />;
}
