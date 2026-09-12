import ProductForm from '@/components/admin/products/ProductForm';
import { getCategories } from '@/lib/actions/category.actions';
export default async function CreateProductPage() {
  const categoriesRes = await getCategories();
  const categories = categoriesRes.success && categoriesRes.data 
    ? categoriesRes.data.map((c: any) => ({ label: c.name, value: c._id, variantType: c.variantType, calculatePriceOnVariantValue: c.calculatePriceOnVariantValue }))
    : [];

  return <ProductForm categories={categories} />;
}
