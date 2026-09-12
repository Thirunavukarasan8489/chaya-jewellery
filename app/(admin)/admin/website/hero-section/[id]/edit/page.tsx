import HeroSectionForm from '@/components/admin/website/HeroSectionForm';
import { getHeroSectionById } from '@/lib/actions/cms.actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditHeroSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getHeroSectionById(id);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const initialData = result.data;

  // Convert the Mongoose object to a plain JS object to avoid React Server Component warnings
  const plainData = JSON.parse(JSON.stringify(initialData));

  return (
    <div className="py-6">
      <HeroSectionForm initialData={plainData} />
    </div>
  );
}
