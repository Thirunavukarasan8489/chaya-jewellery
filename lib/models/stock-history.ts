import mongoose from "mongoose";

const StockHistorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },

    previousStock: { type: Number, required: true },
    adjustment: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

StockHistorySchema.index({ productId: 1, createdAt: -1 });
StockHistorySchema.index({ variantId: 1, createdAt: -1 });

export const StockHistory =
  mongoose.models.StockHistory ||
  mongoose.model("StockHistory", StockHistorySchema);
