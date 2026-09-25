import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, enum: ["ACTIVE", "DRAFT"], default: "DRAFT" },
    metaTitle: { type: String },
    metaDescription: { type: String },
    image: { type: String }, // Cloudinary URL
  },
  { timestamps: true },
);

export const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
