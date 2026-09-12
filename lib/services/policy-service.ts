import dbConnect from '@/lib/db';
import { Policy } from '@/lib/models/policy';
import { unstable_cache } from 'next/cache';

export const getPolicies = unstable_cache(async () => {
  await dbConnect();
  return await Policy.find({ isActive: true }).lean();
}, ['policies'], { tags: ['policies'], revalidate: 3600 });

export const getPolicy = unstable_cache(async (slug: string) => {
  await dbConnect();
  return await Policy.findOne({ slug, isActive: true }).lean();
}, ['policy-by-slug'], { tags: ['policies'], revalidate: 3600 });
