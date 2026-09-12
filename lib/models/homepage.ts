import mongoose from 'mongoose';

const HomepageSectionSchema = new mongoose.Schema({
  type: { type: String, enum: ['HERO', 'TRUST_HIGHLIGHTS', 'PROMO_BANNER', 'FEATURED_CATEGORIES', 'FEATURED_PRODUCTS', 'WHY_A1_GEMS', 'TESTIMONIALS', 'FAQ'], required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, required: true },
  // Flexible config object storing JSON payload for the section (e.g. text, colors, banner URLs)
  config: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const HomepageSchema = new mongoose.Schema(
  {
    announcementBar: {
      enabled: { type: Boolean, default: true },
      text: { type: String },
      link: { type: String }
    },
    sections: [HomepageSectionSchema]
  },
  { timestamps: true }
);

export const Homepage = mongoose.models.Homepage || mongoose.model('Homepage', HomepageSchema);
