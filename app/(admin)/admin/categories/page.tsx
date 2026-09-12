import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCategories } from '@/lib/actions/category.actions';
import CategoriesTable from '@/components/admin/categories/CategoriesTable';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const result = await getCategories();
  const categories = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Categories</h1>
          <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
            Manage product categories — {categories.length} total
          </p>
        </div>
        <Link
          href="/admin/categories/create"
          className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          Add Category
        </Link>
      </div>

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Failed to load categories: {(result as any).error}
          </p>
        </div>
      )}

      <CategoriesTable categories={categories} />
    </div>
  );
}
