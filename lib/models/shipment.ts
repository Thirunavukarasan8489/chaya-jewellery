import mongoose from 'mongoose';

const ShipmentItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
});

const ShipmentSchema = new mongoose.Schema(
  {
    shipmentNumber: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    courierName: { type: String, required: true },
    trackingNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED'],
      default: 'PENDING',
    },
    items: [ShipmentItemSchema],
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Shipment = mongoose.models.Shipment || mongoose.model('Shipment', ShipmentSchema);
