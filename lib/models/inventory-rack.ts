import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryRack extends Document {
  inventoryId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  rackNumber: number;
  internalProductCode: string;
  quantity: number;
  capacity: number;
  status: "AVAILABLE" | "FULL" | "EMPTY";
}

const inventoryRackSchema = new Schema(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    rackNumber: { type: Number, required: true },
    internalProductCode: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["AVAILABLE", "FULL", "EMPTY"], default: "AVAILABLE" },
  },
  { timestamps: true }
);

// Ensure a product can only have one rack with a specific number
inventoryRackSchema.index({ productId: 1, rackNumber: 1 }, { unique: true });

export const InventoryRack = mongoose.models.InventoryRack || mongoose.model<IInventoryRack>("InventoryRack", inventoryRackSchema);
