import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import { Category } from '@/lib/models/category';

export const getCategories = unstable_cache(async () => {
  try {
    await dbConnect();
    // Fetch categories (active first, fallback to all)
    let categories = await Category.find({ status: 'ACTIVE' }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    if (!categories || categories.length === 0) {
      categories = await Category.find({}).sort({ displayOrder: 1, createdAt: -1 }).lean();
    }
    
    if (categories && categories.length > 0) {
      return categories.map((cat: any) => ({
        ...cat,
        _id: cat._id.toString(),
      }));
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  return [];
}, ['public-categories-v5'], { revalidate: 60, tags: ['categories'] });

export const getCategoryBySlug = unstable_cache(async (slug: string) => {
  try {
    await dbConnect();
    let category = await Category.findOne({ slug, status: 'ACTIVE' }).lean();
    if (!category) {
      category = await Category.findOne({ slug }).lean();
    }
    if (category) {
      return {
        ...category,
        _id: (category as any)._id.toString(),
      };
    }
  } catch (error) {
    console.error("Error fetching category by slug:", error);
  }

  return null;
}, ['public-category-by-slug-v5'], { revalidate: 60, tags: ['categories'] });
