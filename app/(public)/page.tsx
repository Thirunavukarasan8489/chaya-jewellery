import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CertificationTrustSection } from "@/components/public/home/certification-trust-section";
import { ConsultationCta } from "@/components/public/home/consultation-cta";
import { FeaturedCategories } from "@/components/public/home/featured-categories";
import { FinalCta } from "@/components/public/home/final-cta";
import { HeroSlider } from "@/components/public/home/hero-slider";
import { HowItWorks } from "@/components/public/home/how-it-works";
import { Testimonials } from "@/components/public/home/testimonials";
import { TrustStrip } from "@/components/public/home/trust-strip";
import { ProductRail } from "@/components/public/product/product-rail";
import { Accordion } from "@/components/public/ui/accordion";
import { buttonStyles } from "@/components/public/ui/button";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { getFaqs, getTestimonials } from "@/lib/services/content-service";
import { getCategories } from "@/lib/services/category-service";
import { NAV_DATA } from "@/lib/utils";
import {
  getBestsellers,
  getFeaturedProducts,
  getProductsByCategory,
} from "@/lib/services/product-service";
import { getHeroSections } from "@/lib/actions/cms.actions";
import { flattenVariants } from "@/lib/utils";

export default async function HomePage() {
  const [
    featured,
    bestsellers,
    bracelets,
    faqs,
    categories,
    sectionsRes,
    testimonials
  ] = await Promise.all([
    getFeaturedProducts(),
    getBestsellers(),
    getProductsByCategory("bracelets"),
    getFaqs(),
    getCategories(),
    getHeroSections(),
    getTestimonials()
  ]);

  const banners = sectionsRes.success && Array.isArray(sectionsRes.data) ? sectionsRes.data.filter((s: any) => s.isActive) : undefined;

  return (
    <>
      {/* 1. Hero Image Banner Slider Section */}
      <HeroSlider categories={categories} banners={banners} />
      <TrustStrip />

      {/* 2. Shop by Category Section */}
      <FeaturedCategories />

      {/* 3. Bestsellers Products */}
      <section className="shell gutter py-12 sm:py-16 lg:py-20">
        <SectionHeading
          eyebrow="Bestsellers"
          title="What people are buying"
          href="/products?sort=popular"
        />
        <div className="mt-7">
          <ProductRail products={flattenVariants(bestsellers)} />
        </div>
      </section>

      {/* 4. Certified Stones Verification Section */}
      <CertificationTrustSection />

      {/* 5. How It Works — 4 Step Gemstone Recommendation */}
      <HowItWorks />

      {/* 6. Everyday Gemstone Bracelets */}
      <section className="bg-ivory-200 py-12 sm:py-16 lg:py-20">
        <div className="shell gutter">
          <SectionHeading
            eyebrow="Everyday pieces"
            title="Gemstone bracelets"
            body="Hand-strung to your wrist measurement and dispatched within 48 hours."
            href="/products?category=bracelets"
          />
          <div className="mt-7">
            <ProductRail products={flattenVariants(bracelets)} />
          </div>
        </div>
      </section>

      {/* 7. Consultation CTA */}
      <ConsultationCta business={NAV_DATA.business} />

      {/* 8. Testimonials Section */}
      <Testimonials items={testimonials} />

      {/* 9. Final CTA */}
      <FinalCta />

      {/* 10. FAQ Accordion Section */}
      <section className="shell gutter py-12 sm:py-16 lg:py-20">
        <div className="lg:grid lg:grid-cols-[0.9fr_1.4fr] lg:items-start lg:gap-14">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions we get asked"
            body="Still unsure? Message us on WhatsApp — a gemmologist replies, not a bot."
          />
          <div className="mt-7 lg:mt-0">
            <Accordion items={faqs.slice(0, 5)} defaultOpenIndex={0} />
            <Link
              href="/faqs"
              className={buttonStyles({
                variant: "ghost",
                size: "sm",
                className: "mt-4",
              })}
            >
              All FAQs
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
