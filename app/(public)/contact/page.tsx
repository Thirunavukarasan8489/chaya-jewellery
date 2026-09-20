import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/public/lead/enquiry-form";
import { Accordion } from "@/components/public/ui/accordion";
import { buttonStyles } from "@/components/public/ui/button";
import { PageHeader } from "@/components/public/ui/page-header";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { getFaqs } from "@/lib/services/content-service";
import { NAV_DATA, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Talk to an Chaya Jewellery gemmologist. Free consultation by phone, WhatsApp or enquiry form. Showroom in Mylapore, Chennai.",
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const searchParams = await props.searchParams;
  const pick = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const product = pick("product");
  const category = pick("category");

  const faqs = await getFaqs();
  const business = NAV_DATA.business;

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to a gemmologist"
        body="Free consultation, no obligation. We reply within a few working hours."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <div className="shell gutter py-10 sm:py-14">
        <div className="lg:grid lg:grid-cols-[1fr_1.3fr] lg:items-start lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Reach us"
              title="However suits you"
              body="Most people WhatsApp us — it is the fastest way to get photographs and a certificate number in front of you."
            />

            <ul className="mt-7 space-y-3">
              <ContactRow
                icon={<Phone size={18} />}
                label="Phone"
                value={business.phone}
                href={business.phoneHref}
              />
              <ContactRow
                icon={<Mail size={18} />}
                label="Email"
                value={business.email}
                href={`mailto:${business.email}`}
              />
              <ContactRow
                icon={<MapPin size={18} />}
                label="Showroom"
                value={business.address}
              />
              <ContactRow
                icon={<Clock size={18} />}
                label="Hours"
                value={business.hours}
              />
            </ul>

            <a
              href={whatsappLink(
                business,
                "Hi Chaya Jewellery, I have a question.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({
                variant: "whatsapp",
                size: "lg",
                full: true,
                className: "mt-6",
              })}
            >
              <MessageCircle size={18} />
              Message us on WhatsApp
            </a>
          </div>

          <div className="mt-10 lg:mt-0">
            <h2 className="mb-5 font-display text-2xl font-semibold text-plum-900">
              Send an enquiry
            </h2>
            <EnquiryForm
              productName={product}
              categoryName={category}
              source={product ? "product-page" : "contact-page"}
            />
          </div>
        </div>
      </div>

      <section className="bg-ivory-200 py-12 sm:py-16">
        <div className="shell gutter lg:grid lg:grid-cols-[0.9fr_1.4fr] lg:items-start lg:gap-14">
          <SectionHeading
            eyebrow="Before you write"
            title="These come up often"
          />
          <div className="mt-7 lg:mt-0">
            <Accordion items={faqs.slice(0, 6)} />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-none bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-muted uppercase">
          {label}
        </span>
        <span className="mt-0.5 block text-[0.9375rem] font-medium text-plum-900">
          {value}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          className="flex items-center gap-3.5 rounded-xl border border-ivory-300 bg-white p-3.5 transition-colors hover:border-gold-300"
        >
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-3.5 rounded-xl border border-ivory-300 bg-white p-3.5">
          {content}
        </div>
      )}
    </li>
  );
}
