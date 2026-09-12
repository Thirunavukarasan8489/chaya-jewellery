import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "Chaya Jewellery" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    whatsappNumber: { type: String, default: "" },
    businessAddress: { type: String, default: "" },
    gstin: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
