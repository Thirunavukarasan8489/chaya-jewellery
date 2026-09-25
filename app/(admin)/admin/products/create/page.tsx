import ProductForm from "@/components/admin/products/ProductForm";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubCategories } from "@/lib/actions/sub-category.actions";

export default async function CreateProductPage() {
  const [categoriesRes, subCategoriesRes] = await Promise.all([
    getCategories(),
    getSubCategories(),
  ]);

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

  return <ProductForm categories={categories} subCategories={subCategories} />;
}
