import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getProductVariantById } from '@/lib/actions/product.actions';
import VariantForm from '@/components/admin/products/VariantForm';

export const dynamic = 'force-dynamic';

export default async function EditProductVariantPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const variantRes = await getProductVariantById(params.id);
  if (!variantRes.success || !variantRes.data) notFound();

  const variant = variantRes.data;
  const product = typeof variant.productId === 'object' ? variant.productId : null;
  const productId = product?._id || variant.productId;
  const category = product?.category && typeof product.category === 'object' ? product.category : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/productvarients"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-plum-800 text-plum-500 hover:bg-gray-50 dark:hover:bg-plum-900 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-plum-900 dark:text-ivory-100">{variant.name}</h1>
          <p className="text-sm text-plum-500">
            Variant of{' '}
            {product ? (
              <Link href={`/admin/products/${product._id}`} className="text-gold-600 hover:underline">
                {product.name}
              </Link>
            ) : (
              'product'
            )}
          </p>
        </div>
      </div>

      <VariantForm
        productId={productId}
        variant={variant}
        calculatePriceOnVariantValue={!!category?.calculatePriceOnVariantValue}
        variantType={category?.variantType}
      />
    </div>
  );
}
