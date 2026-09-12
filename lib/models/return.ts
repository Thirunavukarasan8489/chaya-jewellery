import mongoose from 'mongoose';

const ReturnItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
});

const ReturnRequestSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    items: [ReturnItemSchema],
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING_INSPECTION', 'APPROVED', 'REJECTED', 'REFUNDED'],
      default: 'PENDING_INSPECTION',
    },
    refundAmount: { type: Number, default: 0 },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

export const ReturnRequest = mongoose.models.ReturnRequest || mongoose.model('ReturnRequest', ReturnRequestSchema);
