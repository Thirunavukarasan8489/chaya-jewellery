import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, required: true, unique: true },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    method: {
      type: String,
      // Keep historic display values readable; new writes use order enums.
      enum: [
        "UPI",
        "CARD",
        "NET_BANKING",
        "COD",
        "BANK_TRANSFER",
        "Card",
        "Net Banking",
        "Bank Transfer",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    transactionId: { type: String }, // Assigned only after a real payment exists.
    source: { type: String, enum: ["CHECKOUT", "MANUAL"], default: "MANUAL" },
    provider: { type: String, enum: ["CASHFREE", "OFFLINE"] },
    currency: { type: String, default: "INR" },
    // Server-only PGCreateOrder request/response, SDK observation, verified
    // gateway responses and attempts. Do not serialize into payment listings.
    cashfree: { type: mongoose.Schema.Types.Mixed, select: false },
    requiresReview: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    notes: { type: String },
  },
  { timestamps: true },
);

PaymentSchema.index(
  { orderId: 1, source: 1 },
  {
    unique: true,
    partialFilterExpression: { source: "CHECKOUT" },
  },
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
