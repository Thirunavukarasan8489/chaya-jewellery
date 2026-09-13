import Link from 'next/link';
import { CldImage } from '@/components/shared/CldImage';
import { notFound } from 'next/navigation';
import { ArrowLeft, Edit, Image as ImageIcon, Info, Layers, FileText, Package } from 'lucide-react';
import { getCategoryById } from '@/lib/actions/category.actions';
import StatusBadge from '@/components/admin/ui/StatusBadge';

export const dynamic = 'force-dynamic';

const variantTypeLabels: Record<string, string> = {
  CARAT: 'Carat',
  SIZE: 'Size',
  WEIGHT: 'Weight',
  NONE: 'No variants',
};

export default async function ViewCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await getCategoryById(resolvedParams.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const category = result.data;
  const isActive = category.status !== 'DRAFT';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/categories" className="inline-flex items-center gap-2 text-sm text-gold-500 hover:text-gold-700 dark:hover:text-gold-300 mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Categories
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gold-800 dark:text-white">{category.name}</h1>
            <StatusBadge label={isActive ? 'Active' : 'Draft'} variant={isActive ? 'success' : 'neutral'} />
          </div>
          <p className="text-sm text-gold-500 dark:text-gold-400 mt-1 flex items-center gap-2">
            <span>Slug: /{category.slug}</span>
            <span className="text-gold-300 dark:text-gold-600">•</span>
            <span>ID: {resolvedParams.id}</span>
          </p>
        </div>

        <Link
          href={`/admin/categories/${resolvedParams.id}/edit`}
          className="inline-flex items-center gap-2 bg-gold-600 hover:bg-gold-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Edit size={16} />
          Edit Category
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Main Info */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Basic Info */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <Info size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Basic Information</h2>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-medium text-gold-700 dark:text-gold-300 mb-2">Description</h3>
              {category.description ? (
                <p className="text-gold-700 dark:text-gold-300 text-sm whitespace-pre-wrap bg-gold-50 dark:bg-gold-800/30 p-4 rounded-lg border border-gold-100 dark:border-gold-800">
                  {category.description}
                </p>
              ) : (
                <div className="text-gold-500 dark:text-gold-400 text-sm bg-gold-50 dark:bg-gold-800/30 p-4 rounded-lg border border-gold-100 dark:border-gold-800">
                  —
                </div>
              )}
            </div>
          </div>

          {/* 2. Cover Image */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <ImageIcon size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Cover Image</h2>
            </div>
            <div className="p-5">
              <div className="relative aspect-video w-full max-w-md rounded-xl overflow-hidden border border-gold-200 dark:border-gold-700 bg-gold-50 dark:bg-gold-800 shadow-sm">
                {category.image ? (
                  <CldImage src={category.image} alt={category.name} fill sizes="(max-width: 768px) 100vw, 448px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gold-400 text-sm">
                    <ImageIcon size={24} className="mb-2 opacity-50" />
                    No cover image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Variant Configuration */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <Layers size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Variant Configuration</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Variant Type</h3>
                <p className="text-gold-800 dark:text-gold-200 font-medium">{variantTypeLabels[category.variantType] || category.variantType}</p>
              </div>
              <div className="bg-gold-50 dark:bg-gold-800/50 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Price by Variant Value</h3>
                <p className="text-gold-800 dark:text-gold-200 font-medium">{category.calculatePriceOnVariantValue ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Meta Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <Package size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">Overview</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Total Products</h3>
                <p className="text-gold-800 dark:text-gold-200 text-sm font-semibold">{category.productCount ?? 0}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Created</h3>
                <p className="text-gold-800 dark:text-gold-200 text-sm">
                  {category.createdAt ? new Date(category.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Last Updated</h3>
                <p className="text-gold-800 dark:text-gold-200 text-sm">
                  {category.updatedAt ? new Date(category.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gold-100 dark:border-gold-800 flex items-center gap-2">
              <FileText size={18} className="text-gold-500 dark:text-gold-400" />
              <h2 className="font-semibold text-gold-800 dark:text-white">SEO</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Meta Title</h4>
                <p className="text-gold-800 dark:text-gold-200 text-sm font-medium">
                  {category.metaTitle || category.name}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gold-500 dark:text-gold-400 uppercase tracking-wider mb-1">Meta Description</h4>
                <p className="text-gold-600 dark:text-gold-400 text-sm bg-gold-50 dark:bg-gold-800/30 p-3 rounded-lg border border-gold-100 dark:border-gold-800">
                  {category.metaDescription || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
