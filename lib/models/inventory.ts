import mongoose, { Schema, Document } from "mongoose";

export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  openingStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  lowStockThreshold: number;
  rackCapacity: number;
}

const inventorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    openingStock: { type: Number, required: true, min: 0 },
    availableStock: { type: Number, required: true, min: 0, default: 0 },
    reservedStock: { type: Number, required: true, min: 0, default: 0 },
    soldStock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    rackCapacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>("Inventory", inventorySchema);
