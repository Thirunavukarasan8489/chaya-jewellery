import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/actions/product.actions';
import { getCategoryById } from '@/lib/actions/category.actions';
import VariantForm from '@/components/admin/products/VariantForm';

export const dynamic = 'force-dynamic';

export default async function CreateProductVariantPage(props: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const productId = searchParams.productId;
  if (!productId) notFound();

  const productRes = await getProductById(productId);
  if (!productRes.success || !productRes.data) notFound();

  const product = productRes.data;
  const categoryId = typeof product.category === 'object' ? product.category?._id : product.category;
  const categoryRes = categoryId ? await getCategoryById(categoryId) : null;
  const category = categoryRes?.success ? categoryRes.data : null;

  // Seed the new variant's media/discount/purchase/SEO from the product's own
  // details — the admin only has to type variant-specific fields (name/value,
  // price) and can tweak or leave the rest as-is before saving.
  const seedVariant = {
    primaryImage: product.primaryImage,
    gallery: product.gallery,
    discountRules: product.discountRules,
    purchaseType: product.purchaseType,
    whatsappEnabled: product.whatsappEnabled,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    keywords: product.keywords,
  };

  return (
    <VariantForm
      productId={productId}
      productName={product.name}
      variant={seedVariant}
      calculatePriceOnVariantValue={!!category?.calculatePriceOnVariantValue}
      variantType={category?.variantType}
    />
  );
}
