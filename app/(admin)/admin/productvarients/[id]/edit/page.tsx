import { notFound } from 'next/navigation';
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
    <VariantForm
      productId={productId}
      variant={variant}
      calculatePriceOnVariantValue={!!category?.calculatePriceOnVariantValue}
      variantType={category?.variantType}
    />
  );
}
