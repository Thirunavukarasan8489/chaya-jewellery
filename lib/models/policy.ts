import mongoose from 'mongoose';

const PolicySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true }, // Rich text / HTML
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Policy = mongoose.models.Policy || mongoose.model('Policy', PolicySchema);
