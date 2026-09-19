import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "CONTENT_MANAGER", "LEAD_MANAGER", "CUSTOMER"],
      default: "CUSTOMER",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    customerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    googleId: { type: String },
    image: { type: String },
    provider: { type: String, default: "credentials" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
