import CategoryForm from '@/components/admin/categories/CategoryForm';
import { getCategoryById } from '@/lib/actions/category.actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const result = await getCategoryById(resolvedParams.id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div>
      <CategoryForm initialData={result.data} />
    </div>
  );
}
