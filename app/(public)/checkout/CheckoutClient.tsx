"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/public/cart/cart-provider";
import { useRouter } from "next/navigation";
import {
  placeOrder,
  calculateOrderTotals,
  createCashfreePaymentSession,
} from "@/lib/actions/checkout.actions";
import toast from "react-hot-toast";
import { CheckCircle2, ChevronRight } from "lucide-react";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Shipping
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  // Payment
  paymentMethod: string;
};

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "COD", label: "Cash on Delivery" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const STEPS = [
  { id: 1, label: "Contact" },
  { id: 2, label: "Shipping" },
  { id: 3, label: "Payment" },
];

export default function CheckoutClient({ customer }: { customer: any | null }) {
  const { lines, subtotal, clear, count, hydrated } = useCart();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [totals, setTotals] = useState({ subtotal: 0, shippingFee: 0, tax: 0, total: 0 });

  const [formData, setFormData] = useState<FormData>({
    firstName: customer?.profile?.firstName || "",
    lastName: customer?.profile?.lastName || "",
    email: customer?.contact?.email || "",
    phone: customer?.contact?.phone || "",
    address: customer?.addresses?.[0]?.street1 || "",
    apartment: customer?.addresses?.[0]?.apartment || "",
    city: customer?.addresses?.[0]?.city || "",
    state: customer?.addresses?.[0]?.state || "",
    zip: customer?.addresses?.[0]?.zip || "",
    country: customer?.addresses?.[0]?.country || "India",
    paymentMethod: "UPI",
  });

  useEffect(() => {
    if (subtotal > 0) {
      calculateOrderTotals(subtotal, formData.state || "")
        .then((res) => setTotals(res))
        .catch(console.error);
    }
  }, [subtotal, formData.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Step 1 summary
  const step1Summary = `${formData.firstName} ${formData.lastName} • ${formData.email} • ${formData.phone}`;
  // Step 2 summary
  const step2Summary = [formData.address, formData.city, formData.state, formData.zip].filter(Boolean).join(", ");

  // Each step must be fully and validly filled before the next one unlocks —
  // returns an error message, or null when the step is valid.
  const validateStep = (targetStep: number): string | null => {
    if (targetStep === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        return "Please enter your first and last name.";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        return "Please enter a valid email address.";
      }
      if (formData.phone.trim().length < 10) {
        return "Please enter a valid phone number.";
      }
    }
    if (targetStep === 3) {
      if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
        return "Please complete the shipping address.";
      }
      if (formData.zip.trim().length < 5) {
        return "Please enter a valid PIN code.";
      }
    }
    return null;
  };

  // Shared by both the "Continue" buttons and Enter-key form submission
  // (a bare form submit skips the button's onClick entirely), so a step
  // can't be skipped through either path.
  const goToStep = (target: number) => {
    const error = validateStep(target);
    if (error) {
      toast.error(error);
      return;
    }
    setStep(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      goToStep(step + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingAddressObj = {
        street: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        pincode: formData.zip,
        country: formData.country,
      };

      const orderData = {
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        shippingAddress: shippingAddressObj,
        billingAddress: shippingAddressObj, // Map billing to shipping
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          sku: l.sku,
          name: l.name,
          quantity: l.quantity,
          price: l.unitPrice,
          variantValue: l.variantValue,
          calculatePriceOnVariantValue: l.calculatePriceOnVariantValue,
        })),
        paymentMethod: formData.paymentMethod,
        subtotal: totals.subtotal,
        shippingFee: totals.shippingFee,
        tax: totals.tax,
        total: totals.total,
      };

      // Order is always created first, regardless of payment method — COD/
      // Bank Transfer need nothing further; everything else needs a
      // Cashfree payment session against this now-real order.
      const result = await placeOrder(orderData);
      if (!result.success) {
        toast.error(result.error || "Failed to place order.");
        setIsSubmitting(false);
        return;
      }

      if (
        formData.paymentMethod === "COD" ||
        formData.paymentMethod === "BANK_TRANSFER"
      ) {
        toast.success("Order placed successfully!");
        clear();
        router.push(`/checkout/success?order=${result.data.orderNumber}`);
        return;
      }

      const sessionRes = await createCashfreePaymentSession(result.data.orderNumber);
      if (!sessionRes.success || !sessionRes.paymentSessionId) {
        toast.error(sessionRes.error || "Failed to initiate payment.");
        setIsSubmitting(false);
        return;
      }

      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox",
      });

      // The cart is already saved server-side as an order at this point —
      // safe to clear it before handing off to Cashfree's hosted checkout,
      // which navigates the whole page away (redirectTarget: "_self") and
      // returns to /checkout/success. Actual payment confirmation comes
      // from the webhook, not this redirect — see checkout/success/page.tsx.
      clear();
      cashfree.checkout({
        paymentSessionId: sessionRes.paymentSessionId,
        redirectTarget: "_self",
      });
      return;
    } catch (error) {
      // This swallowed the real error with no trace before — the
      // Cashfree CSP fix (next.config.ts) was only findable by
      // reproducing the failure directly, because this line gave no clue
      // it was a blocked-script issue rather than a server/logic bug.
      console.error("Checkout failed:", error);
      toast.error("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  // Defer rendering until the client-side cart is hydrated from localStorage.
  // Without this, the server renders count=0 (no localStorage on SSR) while
  // the client hydrates with items — causing a React hydration mismatch.
  if (!hydrated) {
    return (
      <div className="mt-10 space-y-4">
        <div className="h-64 rounded-2xl bg-plum-100/60 animate-pulse" />
        <div className="h-40 rounded-2xl bg-plum-100/60 animate-pulse" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-plum-900 mb-4">Your cart is empty</h2>
        <button
          onClick={() => router.push("/collections")}
          className="bg-gold-500 text-white px-6 py-2 rounded-xl"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
      <div className="lg:col-span-7 space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  step >= s.id ? "text-plum-900" : "text-plum-400"
                }`}
              >
                {step > s.id ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-none flex items-center justify-center text-xs border-2 ${
                      step === s.id
                        ? "border-gold-500 bg-gold-500 text-white"
                        : "border-plum-300 text-plum-400"
                    }`}
                  >
                    {s.id}
                  </span>
                )}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-plum-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Contact ── */}
        <section className="bg-white p-6 rounded-2xl border border-plum-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-plum-900 flex items-center gap-2">
              {step > 1 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <span className="w-5 h-5 rounded-none bg-gold-500 text-white flex items-center justify-center text-xs">1</span>
              )}
              Contact Information
            </h2>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium underline underline-offset-2"
              >
                Edit
              </button>
            )}
          </div>

          {step > 1 ? (
            <p className="text-sm text-plum-600 line-clamp-2">{step1Summary}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-plum-900 mb-1">First Name *</label>
                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="Jane" />
              </div>
              <div>
                <label className="block text-sm font-medium text-plum-900 mb-1">Last Name *</label>
                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-plum-900 mb-1">Email *</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-plum-900 mb-1">Phone *</label>
                <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="+91 98765 43210" />
              </div>

              <div className="col-span-2 flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="bg-plum-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-plum-800 transition-colors"
                >
                  Continue to Shipping →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── STEP 2: Shipping Address ── */}
        <section className="bg-white p-6 rounded-2xl border border-plum-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-plum-900 flex items-center gap-2">
              {step > 2 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <span className={`w-5 h-5 rounded-none flex items-center justify-center text-xs border-2 ${step === 2 ? "bg-gold-500 border-gold-500 text-white" : "border-plum-300 text-plum-400"}`}>2</span>
              )}
              Shipping Address
            </h2>
            {step > 2 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-gold-600 hover:text-gold-700 text-sm font-medium underline underline-offset-2"
              >
                Edit
              </button>
            )}
          </div>

          {step < 2 ? (
            <p className="text-sm text-plum-400 italic">Complete the previous step first</p>
          ) : step > 2 ? (
            <p className="text-sm text-plum-600">{step2Summary}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-plum-900 mb-1">Street Address *</label>
                <input required name="address" value={formData.address} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="123 Main Street" />
              </div>
              <div>
                <label className="block text-sm font-medium text-plum-900 mb-1">Apartment / Floor (optional)</label>
                <input name="apartment" value={formData.apartment} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="Apt 4B, 2nd Floor" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-plum-900 mb-1">City *</label>
                  <input required name="city" value={formData.city} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-plum-900 mb-1">State *</label>
                  <input required name="state" value={formData.state} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-plum-900 mb-1">PIN Code *</label>
                  <input required name="zip" value={formData.zip} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm" placeholder="400001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-plum-900 mb-1">Country</label>
                  <input name="country" value={formData.country} onChange={handleChange} className="w-full rounded-xl border border-plum-200 px-4 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm bg-plum-50" />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={() => setStep(1)} className="text-plum-500 hover:text-plum-700 text-sm font-medium">← Back</button>
                <button type="button" onClick={() => goToStep(3)} className="bg-plum-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-plum-800 transition-colors">Continue to Payment →</button>
              </div>
            </div>
          )}
        </section>

        {/* ── STEP 3: Payment Method ── */}
        <section className="bg-white p-6 rounded-2xl border border-plum-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-plum-900 flex items-center gap-2">
              <span className={`w-5 h-5 rounded-none flex items-center justify-center text-xs border-2 ${step === 3 ? "bg-gold-500 border-gold-500 text-white" : "border-plum-300 text-plum-400"}`}>3</span>
              Payment Method
            </h2>
          </div>

          {step < 3 ? (
            <p className="text-sm text-plum-400 italic">Complete the previous steps first</p>
          ) : (
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    formData.paymentMethod === m.value
                      ? "border-gold-500 bg-gold-50"
                      : "border-plum-200 hover:border-plum-300 hover:bg-plum-50"
                  }`}
                >
                  <span
                    className={`inline-flex w-4 h-4 rounded-none border-2 items-center justify-center flex-shrink-0 transition-colors ${
                      formData.paymentMethod === m.value
                        ? "border-gold-500 bg-gold-500"
                        : "border-plum-300 bg-white"
                    }`}
                  >
                    {formData.paymentMethod === m.value && (
                      <span className="w-1.5 h-1.5 rounded-none bg-white block" />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.value}
                    checked={formData.paymentMethod === m.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="font-medium text-plum-900 text-sm">{m.label}</span>
                </label>
              ))}

              <div className="flex justify-start mt-2">
                <button type="button" onClick={() => setStep(2)} className="text-plum-500 hover:text-plum-700 text-sm font-medium">← Back to Shipping</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── ORDER SUMMARY SIDEBAR ── */}
      <div className="lg:col-span-5">
        <div className="bg-plum-50 p-6 rounded-3xl sticky top-8 border border-plum-100">
          <h2 className="text-xl font-bold text-plum-900 mb-6">Order Summary</h2>

          <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto pr-2">
            {lines.map((item, idx) => {
              // Must mirror the subtotal math in cart-provider.tsx and the
              // server-side lineTotal in checkout.actions.ts — a variant-value
              // priced line (e.g. price per carat) needs unitPrice * quantity *
              // variantValue, not just unitPrice * quantity.
              const lineTotal =
                item.calculatePriceOnVariantValue && item.variantValue
                  ? item.unitPrice * item.quantity * item.variantValue
                  : item.unitPrice * item.quantity;

              return (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-plum-300 text-xs border border-plum-100">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="font-medium text-plum-900 line-clamp-1">{item.name}</p>
                      {item.variantName && <p className="text-plum-500 text-xs">{item.variantName}</p>}
                    </div>
                  </div>
                  <span className="font-semibold text-plum-900">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-plum-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-plum-600">
              <span>Subtotal</span>
              <span className="font-medium text-plum-900">₹{totals.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-plum-600">
              <span>Shipping</span>
              <span className="font-medium text-plum-900">
                {totals.shippingFee === 0 ? "Free" : `₹${totals.shippingFee.toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="flex justify-between text-plum-600">
              <span>GST</span>
              <span className="font-medium text-plum-900">₹{totals.tax.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="border-t border-plum-200 mt-4 pt-4 flex justify-between items-end">
            <span className="text-lg font-bold text-plum-900">Total</span>
            <span className="text-2xl font-bold text-gold-600">₹{totals.total.toLocaleString("en-IN")}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || step < 3}
            className={`w-full mt-6 font-bold py-3.5 rounded-xl transition-all ${
              step === 3
                ? "bg-gold-500 hover:bg-gold-600 text-white shadow-lg shadow-gold-500/20"
                : "bg-plum-200 text-plum-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Processing..." : step < 3 ? `Complete Step ${step} first` : "Place Order"}
          </button>
        </div>
      </div>
    </form>
  );
}
