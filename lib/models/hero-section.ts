import mongoose from 'mongoose';

const HeroSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Everything below is optional — a banner can be just an uploaded image
    // (the whole slide links to `ctaHref` if set), or a full text+button
    // overlay on top of it. HeroSlider decides what to render based on
    // what's actually filled in; nothing here is forced to appear.
    badge: { type: String },
    title: { type: String },
    subtitle: { type: String },
    ctaText: { type: String },
    ctaHref: { type: String },
    secondaryCtaText: { type: String },
    secondaryCtaHref: { type: String },
    // Banners without photography fall back to the GemImage placeholder art
    // (see components/public/ui/gem-image.tsx) instead of requiring real
    // Cloudinary media up front.
    image: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HeroSection = mongoose.models.HeroSection || mongoose.model('HeroSection', HeroSectionSchema);
