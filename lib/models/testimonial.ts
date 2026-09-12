import mongoose from 'mongoose';

const TestimonialSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    location: { type: String },
    quote: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    productReference: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
