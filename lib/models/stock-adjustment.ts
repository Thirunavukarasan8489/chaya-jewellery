import mongoose from 'mongoose';

const StockAdjustmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: false }, // if variant-wise
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  adjustment: { type: Number, required: true },
  reason: { type: String, required: false },
  adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
}, { timestamps: true });

export const StockAdjustment = mongoose.models.StockAdjustment || mongoose.model('StockAdjustment', StockAdjustmentSchema);
