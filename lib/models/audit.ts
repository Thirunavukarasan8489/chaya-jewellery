import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entity: { type: String, required: true }, // e.g., "Order", "Product", "Settings"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    
    // JSON snapshot or diff
    metadata: { type: mongoose.Schema.Types.Mixed },
    
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
