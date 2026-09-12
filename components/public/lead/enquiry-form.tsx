"use client";

import * as React from "react";
import { Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/public/ui/button";
import { cn } from "@/lib/utils";

/**
 * §10 Enquiry Flow. Field set matches the Lead document exactly (customer
 * information + enquiry information + source) so wiring this to the real
 * `POST /api/leads` server action in Phase 06 is a one-line change to onSubmit.
 */
export function EnquiryForm({
  productName,
  categoryName,
  source = "website",
  compact = false,
}: {
  productName?: string;
  categoryName?: string;
  source?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    // TODO(Phase 06): POST to the leads service instead of this stub.
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    console.info("Lead captured (not yet persisted):", payload);

    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-600/25 bg-emerald-50 p-6 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-600 text-white">
          <Check size={22} strokeWidth={3} />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-emerald-900">
          Enquiry received
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-emerald-800">
          A gemmologist will call or message you within a few working hours. If
          it is urgent, WhatsApp us and we will pick it up straight away.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={() => setStatus("idle")}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-2xl border border-ivory-300 bg-white p-5 sm:p-6",
        compact && "border-0 bg-transparent p-0",
      )}
    >
      <input type="hidden" name="source" value={source} />
      {productName && (
        <input type="hidden" name="product" value={productName} />
      )}
      {categoryName && (
        <input type="hidden" name="category" value={categoryName} />
      )}

      {productName && (
        <p className="mb-5 rounded-xl bg-ivory-200 px-4 py-3 text-sm text-plum-800">
          Enquiring about{" "}
          <span className="font-semibold text-plum-950">{productName}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required autoComplete="name" />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="+91 98400 12345"
        />
        <Field
          label="WhatsApp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          hint="If different from phone"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
        />
        <Field
          label="City"
          name="location"
          className="sm:col-span-2"
          autoComplete="address-level2"
        />

        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-[0.8125rem] font-medium text-plum-800">
            Message
          </span>
          <textarea
            name="message"
            rows={4}
            placeholder="Tell us your budget, the carat weight you have in mind, or what you are trying to achieve."
            className="w-full rounded-xl border border-plum-900/15 bg-ivory-50 px-3.5 py-3 text-plum-900 transition-colors placeholder:text-plum-400 focus:border-gold-500 focus:bg-white"
          />
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        full
        disabled={status === "sending"}
        className="mt-5"
      >
        {status === "sending" ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send size={17} />
            Send enquiry
          </>
        )}
      </Button>

      <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">
        We reply within a few working hours. No spam, no reselling your details.
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  className,
  ...props
}: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-plum-800">
        {label}
        {props.required && <span className="ml-0.5 text-danger-500">*</span>}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-plum-900/15 bg-ivory-50 px-3.5 text-plum-900 transition-colors placeholder:text-plum-400 focus:border-gold-500 focus:bg-white"
      />
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}
