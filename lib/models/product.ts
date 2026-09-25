import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    // Basic
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    productCode: { type: String, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" },
    shortDescription: { type: String },
    description: { type: String },

    // Pricing & Inventory
    discountRules: [
      {
        minQty: { type: Number, required: true },
        maxQty: { type: Number, required: true },
        discountPercentage: { type: Number, required: true },
      },
    ],

    // Product-level pricing/weight properties
    price: { type: Number, required: true },
    priceCode: { type: String },
    grossWeight: { type: Number, min: 0 },
    netWeight: { type: Number, min: 0 },
    stoneWeight: { type: Number, min: 0 },

    specifications: {
      material: { type: String, default: "Silver" },
      purity: { type: String, default: "925" },
      colour: { type: String, default: "Silver" },
      style: { type: String },
      occasion: { type: String },
      stoneType: { type: String },
      stoneColour: { type: String },
      collectionName: { type: String },
    },

    // Inventory
    stockStatus: {
      type: String,
      enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"],
      default: "IN_STOCK",
    },
    status: { type: String, enum: ["ACTIVE", "DRAFT"], default: "DRAFT" },

    // Homepage curation — surfaced by getFeaturedProducts()/getBestsellers()
    // in lib/services/product-service.ts. Not yet exposed in the admin
    // product form; toggle directly in the database or wire up an admin
    // checkbox in a follow-up.
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },

    // Purchase Config
    purchaseType: {
      type: String,
      enum: ["ENQUIRE_ONLY", "BUY_ONLY", "BUY_ENQUIRE"],
      required: true,
    },
    whatsappEnabled: { type: Boolean, default: false },

    // Images
    primaryImage: {
      url: { type: String },
      altText: { type: String },
    }, // Cloudinary URL + Alt Text
    gallery: [
      {
        url: { type: String },
        altText: { type: String },
      },
    ],

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],
    ogImage: { type: String },
  },
  { timestamps: true },
);

ProductSchema.index({ status: 1, stockStatus: 1 });
ProductSchema.index({ category: 1 });
// PERFORMANCE: getNewArrivals() (product-service.ts) filters status=ACTIVE
// and sorts createdAt desc — neither existing index covers that sort, so
// Mongo had to filter via the index above then sort the results in memory.
ProductSchema.index({ status: 1, createdAt: -1 });

export const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
