"use client";

import { useState, useMemo } from 'react';
import DataTable from '@/components/admin/ui/DataTable';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Eye, Edit, Filter } from 'lucide-react';
import Link from 'next/link';
import { deleteCategory } from '@/lib/actions/category.actions';
import DeleteConfirmButton from '@/components/admin/ui/DeleteConfirmButton';
import { CldImage } from '@/components/shared/CldImage';
import { variantTypeLabel } from '@/lib/utils';

type CategoryRow = {
  _id: string;
  name: string;
  slug: string;
  status?: 'ACTIVE' | 'DRAFT';
  image?: string;
  variantType?: string;
  productCount?: number;
};

const VARIANT_TYPES = ['CARAT', 'SIZE', 'WEIGHT', 'NONE'];

export default function CategoriesTable({ categories }: { categories: CategoryRow[] }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [variantTypeFilter, setVariantTypeFilter] = useState('');

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (statusFilter && (c.status ?? 'DRAFT') !== statusFilter) return false;
      if (variantTypeFilter && (c.variantType ?? 'NONE') !== variantTypeFilter) return false;
      return true;
    });
  }, [categories, statusFilter, variantTypeFilter]);

  const renderFilter = () => (
    <div className="relative">
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className={`p-2 border rounded-lg transition-colors flex items-center gap-2 ${filterOpen || statusFilter || variantTypeFilter ? 'bg-gold-50 border-gold-300 text-gold-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
      >
        <Filter size={18} />
        {(statusFilter || variantTypeFilter) && (
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        )}
      </button>

      {filterOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-semibold text-sm">Filter Categories</h4>
            <button
              onClick={() => {
                setStatusFilter('');
                setVariantTypeFilter('');
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Variant Type</label>
            <select
              value={variantTypeFilter}
              onChange={(e) => setVariantTypeFilter(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-md"
            >
              <option value="">All Variant Types</option>
              {VARIANT_TYPES.map((t) => (
                <option key={t} value={t}>{variantTypeLabel(t)}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const columns = [
    {
      header: 'Cover Image',
      cell: (item: CategoryRow) => (
        <div className="w-10 h-10 bg-gold-100 dark:bg-gold-800 rounded-md overflow-hidden flex-shrink-0 border border-gold-200 dark:border-gold-700">
          {item.image ? (
            <CldImage
              src={item.image}
              alt={item.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold-400 text-xs">No img</div>
          )}
        </div>
      ),
    },
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
      header: 'Variant Type',
      cell: (item: CategoryRow) => (
        <span className="text-gold-700 dark:text-gold-300">{variantTypeLabel(item.variantType)}</span>
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
        const isActive = item.status === 'ACTIVE';
        return <StatusBadge label={isActive ? 'Active' : 'Draft'} variant={isActive ? 'success' : 'neutral'} />;
      },
    },
    {
      header: 'Actions',
      cell: (item: CategoryRow) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/categories/${item._id}`}
            className="p-1 text-gold-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <Eye size={16} />
          </Link>
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

  return <DataTable title="All Categories" columns={columns} data={filteredCategories} renderFilter={renderFilter} />;
}
