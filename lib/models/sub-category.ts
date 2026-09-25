import mongoose from "mongoose";

const SubCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    type: { type: String, enum: ["SINGLE", "COMBO"], default: "SINGLE" },
    comboIncludes: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" }],
    comboDiscount: { type: Number, default: 0 },
    
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String }, // Cloudinary URL
    metaTitle: { type: String },
    metaDescription: { type: String },
    status: { type: String, enum: ["ACTIVE", "DRAFT"], default: "DRAFT" },
  },
  { timestamps: true }
);

SubCategorySchema.index({ category: 1 });
SubCategorySchema.index({ type: 1 });

export const SubCategory =
  mongoose.models.SubCategory || mongoose.model("SubCategory", SubCategorySchema);
