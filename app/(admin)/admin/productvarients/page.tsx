import { getAllProductVariants } from '@/lib/actions/product.actions';
import ProductVariantsTable from '@/components/admin/products/ProductVariantsTable';

export const dynamic = 'force-dynamic';

export default async function ProductVariantsPage() {
  const result = await getAllProductVariants(1, 200);
  const variants = result.success && Array.isArray(result.data) ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gold-800 dark:text-white">Product Variants</h1>
        <p className="text-sm text-gold-500 dark:text-gold-400 mt-1">
          Every standalone variant across the catalogue — {variants.length} variants
        </p>
      </div>

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">
            Failed to load product variants: {(result as any).error}
          </p>
        </div>
      )}

      <ProductVariantsTable variants={variants} />
    </div>
  );
}
