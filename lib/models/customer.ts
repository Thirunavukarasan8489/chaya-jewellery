import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street1: { type: String, required: true },
  street2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true, default: "India" },
});

const CustomerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["PERSONAL", "BUSINESS"],
      default: "PERSONAL",
    },
    contact: {
      email: { type: String },
      phone: { type: String },
    },
    profile: {
      firstName: { type: String },
      lastName: { type: String },
    },
    businessDetails: {
      companyName: { type: String },
      gstRegistered: { type: Boolean, default: false },
      gstin: { type: String },
      legalName: { type: String },
      gstAddress: AddressSchema,
    },
    addresses: [AddressSchema],
    metrics: {
      totalOrders: { type: Number, default: 0 },
      totalSpend: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Customer =
  mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
