import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  priceSnapshot: { type: Number, required: true },
  variantValue: { type: Number },
  calculatePriceOnVariantValue: { type: Boolean, default: false }
});

const TemporaryCartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    items: [CartItemSchema],
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// MongoDB TTL Index for automatic expiration
TemporaryCartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TemporaryCart = mongoose.models.TemporaryCart || mongoose.model('TemporaryCart', TemporaryCartSchema);
