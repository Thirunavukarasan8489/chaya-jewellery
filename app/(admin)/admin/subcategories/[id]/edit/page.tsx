import SubCategoryForm from "@/components/admin/subcategories/SubCategoryForm";
import { getCategories } from "@/lib/actions/category.actions";
import { getSubCategoryById, getSubCategories } from "@/lib/actions/sub-category.actions";
import { notFound } from "next/navigation";

export default async function EditSubCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [subCategoryRes, categoriesRes, subCategoriesRes] = await Promise.all([
    getSubCategoryById(id),
    getCategories(),
    getSubCategories(),
  ]);

  if (!subCategoryRes.success || !subCategoryRes.data) {
    notFound();
  }
  console.log("Subcategory Data fetched for edit:", subCategoryRes.data);

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
      <SubCategoryForm 
        initialData={subCategoryRes.data} 
        categories={categories} 
        subCategories={subCategories}
      />
    </div>
  );
}
