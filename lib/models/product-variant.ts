import mongoose from 'mongoose';

const ProductVariantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    name: { type: String, required: true },
    slug: { type: String },
    sku: { type: String },
    variantValue: { type: Number },
    caratApprox: { type: Number },
    size: { type: String },

    price: { type: Number, required: true },
    comparePrice: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },

    // Cover Image & Gallery
    primaryImage: {
      url: { type: String },
      altText: { type: String }
    },
    gallery: [{
      url: { type: String },
      altText: { type: String }
    }],

    // Purchase Rules
    purchaseType: {
      type: String,
      enum: ['ENQUIRE_ONLY', 'BUY_ONLY', 'BUY_ENQUIRE'],
      default: 'BUY_ENQUIRE'
    },
    whatsappEnabled: { type: Boolean, default: false },

    // Discount Rules
    discountRules: [{
      minQty: { type: Number, required: true },
      maxQty: { type: Number, required: true },
      discountPercentage: { type: Number, required: true }
    }],

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    ogImage: { type: String },
  },
  { timestamps: true }
);

ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ categoryId: 1 });
ProductVariantSchema.index({ slug: 1 });

export const ProductVariant = mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema);
