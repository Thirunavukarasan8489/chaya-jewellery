import Link from "next/link";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { Accordion } from "@/components/public/ui/accordion";
import { buttonStyles } from "@/components/public/ui/button";
import { PageHeader } from "@/components/public/ui/page-header";
import { getFaqs } from "@/lib/services/content-service";
import { NAV_DATA, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers on certification, treatments, returns, shipping, GST invoices and COD for Chaya Jewellery purchases.",
};

export default async function FaqsPage() {
  const business = NAV_DATA.business;
  const faqs = await getFaqs();
      return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions we get asked"
        body="If yours is not here, message us — a gemmologist replies, not a bot."
        breadcrumbs={[{ label: "FAQs" }]}
      />

      <div className="shell gutter py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <Accordion items={faqs} defaultOpenIndex={0} />

          <div className="mt-8 rounded-2xl border border-ivory-300 bg-white p-6 text-center">
            <h2 className="font-display text-xl font-semibold text-plum-900">
              Still stuck?
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted">
              Ask us directly. No obligation, and we will tell you if the answer
              means you should not buy.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink(business, "Hi Chaya Jewellery, I have a question.")}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "whatsapp" })}
              >
                <MessageCircle size={17} />
                WhatsApp us
              </a>
              <Link
                href="/contact"
                className={buttonStyles({ variant: "outline" })}
              >
                Send an enquiry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
