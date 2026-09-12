import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    // Basic
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    baseSku: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    shortDescription: { type: String },
    description: { type: String },

    // Pricing & Inventory
    discountRules: [{
      minQty: { type: Number, required: true },
      maxQty: { type: Number, required: true },
      discountPercentage: { type: Number, required: true }
    }],

    // Variants live in the standalone ProductVariant collection, referenced by
    // productId. hasVariants just toggles whether the storefront shows the
    // variant selector UI.
    hasVariants: { type: Boolean, default: true },

    // Inventory
    reservedQuantity: { type: Number, required: true, default: 0 },
    stockStatus: { type: String, enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'], default: 'IN_STOCK' },
    status: { type: String, enum: ['ACTIVE', 'DRAFT'], default: 'DRAFT' },

    // Purchase Config
    purchaseType: {
      type: String,
      enum: ['ENQUIRE_ONLY', 'BUY_ONLY', 'BUY_ENQUIRE'],
      required: true
    },
    whatsappEnabled: { type: Boolean, default: false },

    // Images
    primaryImage: {
      url: { type: String },
      altText: { type: String }
    }, // Cloudinary URL + Alt Text
    gallery: [{
      url: { type: String },
      altText: { type: String }
    }],

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    ogImage: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1, stockStatus: 1 });
ProductSchema.index({ category: 1 });

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
