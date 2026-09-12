import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema(
  {
    // Customer Info
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    email: { type: String },
    location: { type: String },
    
    // Enquiry Info
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    message: { type: String, required: true },
    source: { type: String, default: 'Website' },
    
    // Management
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'FOLLOW_UP', 'QUALIFIED', 'CONVERTED', 'CLOSED', 'SPAM'],
      default: 'NEW'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: [{
      content: { type: String },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],
    followUpDate: { type: Date }
  },
  { timestamps: true }
);

LeadSchema.index({ status: 1 });
LeadSchema.index({ followUpDate: 1 });

export const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
