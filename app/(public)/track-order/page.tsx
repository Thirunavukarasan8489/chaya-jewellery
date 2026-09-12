import type { Metadata } from "next";
import { MessageCircle, PackageSearch } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { PageHeader } from "@/components/public/ui/page-header";
import { NAV_DATA, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Track Order",
  description:
    "Track your Chaya Jewellery order with your order number and the email or phone used at checkout.",
};

export default async function TrackOrderPage() {
  const business = NAV_DATA.business;

  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="Track your order"
        body="Enter your order number and the email or phone you used at checkout."
        breadcrumbs={[{ label: "Track Order" }]}
      />

      <div className="shell gutter py-10 sm:py-14">
        <div className="mx-auto max-w-lg">
          {/* Wired to the order service in Phase 09; the form shape is final. */}
          <form className="rounded-2xl border border-ivory-300 bg-white p-5 sm:p-6">
            <label className="block">
              <span className="mb-1.5 block text-[0.8125rem] font-medium text-plum-800">
                Order number
              </span>
              <input
                name="orderNumber"
                placeholder="AG-2026-0000"
                className="h-12 w-full rounded-xl border border-plum-900/15 bg-ivory-50 px-3.5 text-plum-900 placeholder:text-plum-400 focus:border-gold-500 focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[0.8125rem] font-medium text-plum-800">
                Email or phone
              </span>
              <input
                name="contact"
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-plum-900/15 bg-ivory-50 px-3.5 text-plum-900 placeholder:text-plum-400 focus:border-gold-500 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled
              className={buttonStyles({ size: "lg", full: true, className: "mt-5" })}
            >
              <PackageSearch size={18} />
              Track order
            </button>

            <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">
              Order tracking goes live with the orders module. In the meantime,
              message us with your order number and we will send you the courier
              tracking link.
            </p>
          </form>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={whatsappLink(business, "Hi Chaya Jewellery, I would like to track my order.")}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: "whatsapp" })}
            >
              <MessageCircle size={17} />
              Ask on WhatsApp
            </a>
            <a
              href={business.phoneHref}
              className={buttonStyles({ variant: "outline" })}
            >
              Call {business.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
