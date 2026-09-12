import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    method: {
      type: String,
      enum: ['UPI', 'Card', 'Net Banking', 'COD', 'Bank Transfer'],
      required: true,
    },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true }, // Bank reference, UTR, etc.
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
