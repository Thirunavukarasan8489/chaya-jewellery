import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { HowItWorks } from "@/components/public/home/how-it-works";
import { WhyChooseUs } from "@/components/public/home/why-choose-us";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { PageHeader } from "@/components/public/ui/page-header";
import { SectionHeading } from "@/components/public/ui/section-heading";

const stats = [
  { value: "50+", label: "Years of Trust" },
  { value: "100%", label: "Certified Natural" },
  { value: "10k+", label: "Happy Customers" },
  { value: "5/5", label: "Google Reviews" },
];

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Chaya Jewellery has been sourcing and certifying natural Jewellery since 2007. Direct relationships at origin, independent laboratory reports, full treatment disclosure.",
};

const values = [
  {
    title: "Disclosure over margin",
    body: "We would rather lose a sale than let someone believe a heated stone is unheated. It costs us money in the short term and it is the only reason we still exist.",
  },
  {
    title: "Source relationships, not middlemen",
    body: "We buy directly from cutters in Mogok, Ratnapura and Jaipur. Every hand a stone passes through adds cost without adding value.",
  },
  {
    title: "Advice you did not pay for",
    body: "Our gemmologists are salaried, not commissioned. Nobody here earns more by pushing you towards a bigger stone.",
  },
];

export default async function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Chaya Jewellery"
        title="Eighteen years, one rule"
        body="Never sell a stone you would not be happy to buy back."
        breadcrumbs={[{ label: "About" }]}
      />

      <section className="shell gutter py-12 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Our story"
              title="From a counter in Mylapore"
            />
            <div className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed text-plum-800">
              <p>
                Chaya Jewellery started in 2007 as a single counter in Mylapore,
                Chennai, buying rough at source and cutting it in-house. The
                trade at the time ran almost entirely on trust in the seller,
                and that trust was frequently misplaced — the same stone could
                be quoted at three wildly different prices in three shops on the
                same street.
              </p>
              <p>
                We decided early on to compete on verifiability rather than on
                relationships. Every stone above ₹25,000 goes to an independent
                laboratory before it enters the catalogue. We hold the report;
                you hold the number and can check it yourself.
              </p>
              <p>
                Today we work with cutters in Mogok, Ratnapura and Jaipur, ship
                across India, and employ four full-time gemmologists whose job
                is to answer questions honestly — including when the honest
                answer loses us a sale.
              </p>
            </div>
            <Link
              href="/contact"
              className={buttonStyles({ variant: "dark", className: "mt-7" })}
            >
              Talk to us
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-3 sm:gap-4">
              <GemImage
                color="#1f4fd8"
                seed={4}
                className="aspect-square rounded-2xl"
              />
              <GemImage
                color="#e0a713"
                seed={9}
                className="aspect-4/5 rounded-2xl"
              />
            </div>
            <div className="grid gap-3 pt-8 sm:gap-4">
              <GemImage
                color="#c81e4a"
                seed={14}
                className="aspect-4/5 rounded-2xl"
              />
              <GemImage
                color="#0f9c68"
                seed={19}
                className="aspect-square rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ivory-300 bg-white">
        <dl className="shell gutter grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {stats.map((stat: any) => (
            <div key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-semibold text-plum-900 tabular-nums sm:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1 block text-xs text-ink-muted">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="shell gutter py-12 sm:py-16">
        <SectionHeading
          eyebrow="What we stand for"
          title="Three commitments"
          align="center"
        />
        <ul className="mt-9 grid gap-5 lg:grid-cols-3">
          {values.map((value, i) => (
            <li
              key={value.title}
              className="rounded-2xl border border-ivory-300 bg-white p-6"
            >
              <span className="font-display text-3xl font-semibold text-gold-500/50 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-plum-900">
                {value.title}
              </h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
                {value.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <WhyChooseUs />
      <HowItWorks />
    </>
  );
}
