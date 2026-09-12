import mongoose from 'mongoose';

const HeroSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    badge: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    ctaText: { type: String, required: true },
    ctaHref: { type: String, required: true },
    secondaryCtaText: { type: String, required: true },
    secondaryCtaHref: { type: String, required: true },
    image: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HeroSection = mongoose.models.HeroSection || mongoose.model('HeroSection', HeroSectionSchema);
