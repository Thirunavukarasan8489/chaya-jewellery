import ProductForm from "@/components/admin/products/ProductForm";
import { getProductById } from "@/lib/actions/product.actions";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubCategories } from "@/lib/actions/sub-category.actions";
import { notFound } from "next/navigation";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const [productRes, categoriesRes, subCategoriesRes] = await Promise.all([
    getProductById(resolvedParams.id),
    getCategories(),
    getSubCategories(),
  ]);

  if (!productRes.success || !productRes.data) {
    return notFound();
  }

  const categories =
    categoriesRes.success && categoriesRes.data
      ? categoriesRes.data.map((c: any) => ({
          label: c.name,
          value: String(c._id),
        }))
      : [];

  const subCategories =
    subCategoriesRes.success && subCategoriesRes.data
      ? subCategoriesRes.data.map((sc: any) => ({
          label: sc.name,
          value: String(sc._id),
          category: String(sc.category?._id || sc.category),
        }))
      : [];

  // Format the existing gallery into the shape expected by ProductForm
  const formattedData = {
    ...productRes.data,
    gallery:
      productRes.data.gallery?.map((g: any) => ({
        url: g.url,
        altText: g.altText || "",
      })) || [],
  };

  return <ProductForm initialData={formattedData} categories={categories} subCategories={subCategories} />;
}
