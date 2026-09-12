"use client";

import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Edit } from 'lucide-react';
import Link from 'next/link';
import { deleteCategory } from '@/lib/actions/category.actions';
import DeleteConfirmButton from '@/components/admin/ui/DeleteConfirmButton';

type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  productCount?: number;
};

export default function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const columns = [
    {
      header: 'Category Name',
      cell: (item: CategoryRow) => (
        <div>
          <p className="font-medium text-gold-800 dark:text-gold-200">{item.name}</p>
          <p className="text-xs text-gold-500 dark:text-gold-400">/{item.slug}</p>
        </div>
      ),
    },
    {
      header: 'Total Products',
      cell: (item: CategoryRow) => (
        <span className="text-gold-700 dark:text-gold-300">{item.productCount ?? 0}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item: CategoryRow) => {
        const isActive = item.isActive !== false;
        return <StatusBadge label={isActive ? 'Active' : 'Inactive'} variant={isActive ? 'success' : 'neutral'} />;
      },
    },
    {
      header: 'Actions',
      cell: (item: CategoryRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/categories/${item._id}/edit`}
            className="p-1 text-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
          >
            <Edit size={16} />
          </Link>
          <DeleteConfirmButton 
            entityId={item._id} 
            entityName={item.name} 
            deleteAction={deleteCategory} 
          />
        </div>
      ),
    },
  ];

  return <DataTable title="All Categories" columns={columns} data={categories} />;
}