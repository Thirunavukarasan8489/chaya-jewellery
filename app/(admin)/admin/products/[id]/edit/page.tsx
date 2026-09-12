import ProductForm from '@/components/admin/products/ProductForm';
import { getProductById } from '@/lib/actions/product.actions';
import { getCategories } from '@/lib/actions/category.actions';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const [productRes, categoriesRes] = await Promise.all([
    getProductById(resolvedParams.id),
    getCategories()
  ]);
  
  if (!productRes.success || !productRes.data) {
    return notFound();
  }
  
  const categories = categoriesRes.success && categoriesRes.data
    ? categoriesRes.data.map((c: any) => ({ label: c.name, value: c._id, variantType: c.variantType, calculatePriceOnVariantValue: c.calculatePriceOnVariantValue }))
    : [];
    
  // Format the existing gallery into the shape expected by ProductForm
  const formattedData = {
    ...productRes.data,
    gallery: productRes.data.gallery?.map((g: any) => ({
      url: g.url,
      altText: g.altText || ''
    })) || []
  };

  return <ProductForm initialData={formattedData} categories={categories} />;
}
