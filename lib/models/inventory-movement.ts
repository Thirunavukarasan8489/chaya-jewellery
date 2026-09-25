import mongoose, { Schema, Document } from "mongoose";

export interface IInventoryMovement extends Document {
  inventoryId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  rackId?: mongoose.Types.ObjectId;
  type: "STOCK_IN" | "SALE" | "RETURN" | "MANUAL_ADJUSTMENT";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceId?: string; // e.g. Order ID, Return Request ID
  reason?: string;
  createdByName?: string; // e.g. Admin name who made adjustment
}

const inventoryMovementSchema = new Schema(
  {
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    rackId: { type: Schema.Types.ObjectId, ref: "InventoryRack", required: false },
    type: { type: String, enum: ["STOCK_IN", "SALE", "RETURN", "MANUAL_ADJUSTMENT"], required: true },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    referenceId: { type: String, required: false },
    reason: { type: String, required: false },
    createdByName: { type: String, required: false, default: "System" },
  },
  { timestamps: true }
);

export const InventoryMovement = mongoose.models.InventoryMovement || mongoose.model<IInventoryMovement>("InventoryMovement", inventoryMovementSchema);
