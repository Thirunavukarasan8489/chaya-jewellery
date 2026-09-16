import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: String },
  sku: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  // Per-unit price above; when calculatePriceOnVariantValue is true (set by
  // the item's category), the true line total is price * quantity *
  // variantValue (e.g. price-per-carat * carats). Both are resolved
  // server-side in checkout.actions.ts, never trusted from the client.
  variantValue: { type: Number },
  calculatePriceOnVariantValue: { type: Boolean, default: false },
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    
    // Customer Info
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    
    // Retail-only storefront — always 'PERSONAL' going forward (see
    // checkout.actions.ts placeOrder). Enum/history kept for old orders
    // placed before the business/GST purchase flow was removed.
    purchaseType: { type: String, enum: ['PERSONAL', 'BUSINESS'], default: 'PERSONAL' },
    
    // GST Info (If Business)
    isGstRegistered: { type: Boolean, default: false },
    gstin: { type: String },
    legalName: { type: String },
    
    // Addresses
    shippingAddress: { type: Object, required: true },
    billingAddress: { type: Object, required: true },
    gstAddress: { type: Object },
    
    // Items
    items: [OrderItemSchema],
    
    // Financials
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    
    // Payment
    paymentMethod: { type: String, enum: ['UPI', 'CARD', 'NET_BANKING', 'COD', 'BANK_TRANSFER'], required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'CONFIRMED', 'FAILED'], default: 'PENDING' },
    
    // Order Lifecycle
    orderStatus: {
      type: String,
      enum: ['PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'DELIVERY_FAILED', 'RETURNED'],
      default: 'PAYMENT_PENDING'
    }
  },
  { timestamps: true }
);

OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
// PERFORMANCE: the admin order list's default sort (order.actions.ts) is
// createdAt descending with no status filter — unindexed before this.
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
