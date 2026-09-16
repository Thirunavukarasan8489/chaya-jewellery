"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";
import { buttonStyles } from "@/components/public/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await subscribeToNewsletter(email);
    setIsSubmitting(false);
    if (res.success) {
      toast.success("You're subscribed — welcome to Chaya Jewellery.");
      setEmail("");
    } else {
      toast.error(res.error || "Something went wrong.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        aria-label="Email address"
        className="h-12 py-3 min-w-0 flex-1 border border-ivory-300 bg-white px-4 text-sm text-plum-900 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className={buttonStyles({ size: "md", className: "shrink-0 font-semibold" })}
      >
        {isSubmitting ? "Subscribing…" : "Subscribe"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
