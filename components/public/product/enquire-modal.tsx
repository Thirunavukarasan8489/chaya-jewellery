"use client";

import * as React from "react";
import { MessageCircle, X } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { createLead } from "@/lib/actions/lead.actions";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface EnquireModalProps {
  productId?: string;
  categoryId?: string;
  productName: string;
  categoryName?: string;
  variantName?: string;
  buyable: boolean;
}

export function EnquireModal({
  productId,
  categoryId,
  productName,
  categoryName,
  variantName,
  buyable,
}: EnquireModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const productNameText = variantName ? `${productName} - ${variantName}` : productName;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      customerName: formData.get("customerName"),
      phone: formData.get("phone"),
      whatsapp: formData.get("whatsapp"),
      email: formData.get("email"),
      location: formData.get("location"),
      product: productId, // passing ObjectId
      category: categoryId, // passing ObjectId
      message: formData.get("message"),
      source: "Website Product Page",
    };

    const promise = createLead(data);
    
    toast.promise(promise, {
      loading: 'Sending enquiry...',
      success: (result) => {
        if (!result.success) {
          throw new Error(result.error);
        }
        return 'Enquiry sent successfully! We will contact you soon.';
      },
      error: (err) => err.message || 'Failed to send enquiry',
    });

    try {
      const res = await promise;
      if (res.success) {
        setIsOpen(false);
      }
    } catch (e) {
      // toast handles the error
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonStyles({
          variant: buyable ? "outline" : "emerald",
          size: "lg",
          full: true,
        })}
      >
        <MessageCircle size={18} />
        Enquire now
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-plum-400 hover:text-plum-900 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-plum-900">
              Enquire about {productNameText}
            </h2>
            <p className="mt-2 text-sm text-plum-700">
              Fill out the form below and our gemstone experts will get back to you shortly.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-plum-900">Name *</label>
                  <input
                    name="customerName"
                    required
                    className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-plum-900">Phone *</label>
                  <input
                    name="phone"
                    required
                    type="tel"
                    className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-plum-900">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-plum-900">Location (City)</label>
                  <input
                    name="location"
                    className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-plum-900">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  defaultValue={`I am interested in ${productNameText}. Please provide more details.`}
                  className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={buttonStyles({
                    variant: "emerald",
                    size: "lg",
                    full: true,
                  })}
                >
                  {isSubmitting ? "Sending..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
