import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import { FAQ } from '@/lib/models/faq';
import { Testimonial } from '@/lib/models/testimonial';
import { Policy } from '@/lib/models/policy';

// Prevent Turbopack tree-shaking
if (!FAQ) console.warn("FAQ model not loaded");
if (!Testimonial) console.warn("Testimonial model not loaded");
if (!Policy) console.warn("Policy model not loaded");

export const getFaqs = unstable_cache(async () => {
  try {
    await dbConnect();
    const faqs = await FAQ.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    if (faqs && faqs.length > 0) {
      return faqs.map((f: any) => ({ ...f, _id: f._id.toString() }));
    }
  } catch (error) {
    console.error("Error in getFaqs:", error);
  }
  return [];
}, ['public-faqs-v3'], { revalidate: 60, tags: ['content'] });

export const getTestimonials = unstable_cache(async () => {
  try {
    await dbConnect();
    const t = await Testimonial.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 }).populate('productReference').lean();
    if (t && t.length > 0) {
      return t.map((item: any) => ({ 
        ...item, 
        _id: item._id.toString(),
        productReference: item.productReference ? {
          ...item.productReference,
          _id: item.productReference._id.toString()
        } : null
      }));
    }
  } catch (error) {
    console.error("Error in getTestimonials:", error);
  }
  return [];
}, ['public-testimonials-v3'], { revalidate: 60, tags: ['content'] });

export const getPolicies = unstable_cache(async () => {
  try {
    await dbConnect();
    const policies = await Policy.find({ isActive: true }).lean();
    if (policies && policies.length > 0) {
      return policies.map((p: any) => ({ ...p, _id: p._id.toString() }));
    }
  } catch (error) {
    console.error("Error in getPolicies:", error);
  }
  return [];
}, ['public-policies-v2'], { revalidate: 60, tags: ['content'] });

export const getPolicyBySlug = unstable_cache(async (slug: string) => {
  try {
    await dbConnect();
    const policy = await Policy.findOne({ slug, isActive: true }).lean();
    if (!policy) return null;
    return { ...policy, _id: (policy as any)._id.toString() };
  } catch (error) {
    console.error("Error in getPolicyBySlug:", error);
    return null;
  }
}, ['public-policy-slug-v2'], { revalidate: 60, tags: ['content'] });
