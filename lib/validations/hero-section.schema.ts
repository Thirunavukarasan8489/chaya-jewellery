import { z } from "zod";

// Mirrors lib/models/hero-section.ts — only `name` is required there;
// everything else is optional by design (see that file's comment: a banner
// can be a bare image, or a full text+button overlay). This schema exists
// so createHeroSection/updateHeroSection validate shape and type before
// writing, like every other CMS/product/order action already does, instead
// of passing `data: any` straight into Mongoose.
export const HeroSectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  badge: z.string().max(200).optional().or(z.literal("")),
  title: z.string().max(300).optional().or(z.literal("")),
  subtitle: z.string().max(500).optional().or(z.literal("")),
  ctaText: z.string().max(100).optional().or(z.literal("")),
  ctaHref: z.string().max(500).optional().or(z.literal("")),
  secondaryCtaText: z.string().max(100).optional().or(z.literal("")),
  secondaryCtaHref: z.string().max(500).optional().or(z.literal("")),
  image: z.string().max(1000).optional().or(z.literal("")),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type HeroSectionInput = z.infer<typeof HeroSectionSchema>;
