import SubCategoryForm from "@/components/admin/subcategories/SubCategoryForm";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubCategories } from "@/lib/actions/sub-category.actions";

export default async function CreateSubCategoryPage() {
  const categoriesRes = await getCategories();
  const subCategoriesRes = await getSubCategories();

  const categories = categoriesRes.success
    ? categoriesRes.data.map((c: any) => ({
        label: c.name,
        value: String(c._id),
      }))
    : [];

  const subCategories = subCategoriesRes.success
    ? subCategoriesRes.data.map((sc: any) => ({
        label: sc.name,
        value: String(sc._id),
      }))
    : [];

  return (
    <div className="max-w-8xl mx-auto">
      <SubCategoryForm categories={categories} subCategories={subCategories} />
    </div>
  );
}
