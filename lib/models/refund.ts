import mongoose from 'mongoose';

const RefundSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    returnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Return' }, // Optional: could be a cancellation refund without a return
    
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    
    // PENDING -> PROCESSING -> COMPLETED | FAILED
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    
    gatewayRefundId: { type: String }, // Provided by payment gateway (e.g. Razorpay/Stripe)
    
    reason: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Refund = mongoose.models.Refund || mongoose.model('Refund', RefundSchema);
