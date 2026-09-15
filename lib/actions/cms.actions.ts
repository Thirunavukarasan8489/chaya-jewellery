'use server';

import dbConnect from '@/lib/db';
import { HeroSection } from '@/lib/models/hero-section';
import { getSession } from '@/lib/auth';
import { revalidatePath, unstable_cache } from 'next/cache';
import { HeroSectionSchema } from '@/lib/validations/hero-section.schema';
import { deleteMediaByUrl } from '@/lib/actions/media.actions';

// Helper to check auth
async function checkAuth(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  
  const normRoles = allowedRoles.map(r => r.replace(' ', '_').toUpperCase());
  if (!normRoles.includes(session.role as string)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  return session;
}

// PERFORMANCE: every other homepage data fetch (products, categories,
// testimonials, FAQs) is wrapped in unstable_cache — this was the one
// left hitting MongoDB fresh on every single homepage request. Matches the
// same revalidate/tag convention already used in product-service.ts and
// content-service.ts.
const getCachedHeroSections = unstable_cache(
  async () => {
    await dbConnect();
    const sections = await HeroSection.find().sort({ displayOrder: 1 }).lean();
    return JSON.parse(JSON.stringify(sections));
  },
  ['public-hero-sections-v1'],
  { revalidate: 60, tags: ['content'] },
);

export async function getHeroSections() {
  try {
    const data = await getCachedHeroSections();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getHeroSectionById(id: string) {
  try {
    await dbConnect();
    const section = await HeroSection.findById(id).lean();
    if (!section) return { success: false, error: 'Section not found' };
    return { success: true, data: JSON.parse(JSON.stringify(section)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createHeroSection(data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    // SECURITY: unlike every sibling CMS/product/order action, this used to
    // take `data: any` straight into Mongoose with no schema check.
    const parsed = HeroSectionSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
    }
    data = parsed.data;

    await dbConnect();

    // Auto-increment displayOrder if not provided or prevent duplicate
    if (data.displayOrder === undefined || data.displayOrder === null) {
      const lastSection = await HeroSection.findOne().sort({ displayOrder: -1 });
      data.displayOrder = lastSection ? lastSection.displayOrder + 1 : 0;
    } else {
      const existing = await HeroSection.findOne({ displayOrder: data.displayOrder });
      if (existing) {
        return { success: false, error: `Display order ${data.displayOrder} is already in use by another hero section.` };
      }
    }

    const section = await HeroSection.create(data);
    
    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    return { success: true, data: JSON.parse(JSON.stringify(section)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHeroSection(id: string, data: any) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);

    // Partial: updateHeroSection is also used for single-field toggles
    // (see toggleHeroSectionActive below), so only the fields actually
    // present need to be valid.
    const parsed = HeroSectionSchema.partial().safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
    }
    data = parsed.data;

    await dbConnect();

    if (data.displayOrder !== undefined && data.displayOrder !== null && data.displayOrder !== '') {
      const existing = await HeroSection.findOne({ displayOrder: data.displayOrder, _id: { $ne: id } });
      if (existing) {
        return { success: false, error: `Display order ${data.displayOrder} is already in use by another hero section.` };
      }
    }

    // Read the image this section pointed at *before* the update, so a
    // replaced image can be cleaned up from Cloudinary afterwards — do this
    // before writing, not just diff against the returned doc, since
    // findByIdAndUpdate only ever gives us the post-update state.
    const previous = await HeroSection.findById(id).select('image').lean() as { image?: string } | null;

    const section = await HeroSection.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();

    if (
      typeof data.image === 'string' &&
      data.image &&
      previous?.image &&
      previous.image !== data.image
    ) {
      // Best-effort: the DB update already succeeded, so a Cloudinary
      // hiccup here shouldn't surface as a failed save to the admin.
      deleteMediaByUrl(previous.image).catch((error) =>
        console.error('Failed to delete replaced hero image from Cloudinary:', error),
      );
    }

    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    revalidatePath(`/admin/website/hero-section/${id}`);
    return { success: true, data: JSON.parse(JSON.stringify(section)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteHeroSection(id: string) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    const section = await HeroSection.findByIdAndDelete(id).lean() as { image?: string } | null;

    if (section?.image) {
      deleteMediaByUrl(section.image).catch((error) =>
        console.error('Failed to delete removed hero image from Cloudinary:', error),
      );
    }

    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleHeroSectionActive(id: string, isActive: boolean) {
  return updateHeroSection(id, { isActive });
}

export async function reorderHeroSections(updates: { id: string, displayOrder: number }[]) {
  try {
    await checkAuth(['SUPER_ADMIN', 'CONTENT_MANAGER']);
    await dbConnect();

    // Perform bulk write to update all displayOrders efficiently
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { displayOrder: update.displayOrder },
      },
    }));

    await HeroSection.bulkWrite(bulkOps);
    
    revalidatePath('/');
    revalidatePath('/admin/website/hero-section');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
