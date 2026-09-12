import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CertificationTrustSection } from "@/components/public/home/certification-trust-section";
import { ConsultationCta } from "@/components/public/home/consultation-cta";
import { FeaturedCategories } from "@/components/public/home/featured-categories";
import { FinalCta } from "@/components/public/home/final-cta";
import { HeroSlider } from "@/components/public/home/hero-slider";
import { HowItWorks } from "@/components/public/home/how-it-works";
import { NewArrivals } from "@/components/public/home/new-arrivals";
import { PromoBanners } from "@/components/public/home/promo-banners";
import { Testimonials } from "@/components/public/home/testimonials";
import { TrustMarquee } from "@/components/public/home/trust-marquee";
import { TrustStrip } from "@/components/public/home/trust-strip";
import { ProductRail } from "@/components/public/product/product-rail";
import { Accordion } from "@/components/public/ui/accordion";
import { buttonStyles } from "@/components/public/ui/button";
import { Reveal } from "@/components/public/ui/reveal";
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

      {/* 2. Trust ribbon — continuous scrolling marquee under the hero */}
      <TrustMarquee />
      <TrustStrip />

      {/* 3. Shop by Category Section */}
      <Reveal>
        <FeaturedCategories />
      </Reveal>

      {/* 4. New Arrivals */}
      <Reveal>
        <NewArrivals />
      </Reveal>

      {/* 5. Shop by Occasion / Collection banners */}
      <Reveal>
        <PromoBanners />
      </Reveal>

      {/* 6. Bestsellers Products */}
      <Reveal>
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
      </Reveal>

      {/* 7. Craftsmanship & Trust */}
      <CertificationTrustSection />

      {/* 8. How It Works — shopping & consultation flow */}
      <HowItWorks />

      {/* 9. Everyday Bangles & Bracelets */}
      <Reveal>
        <section className="bg-ivory-200 py-12 sm:py-16 lg:py-20">
          <div className="shell gutter">
            <SectionHeading
              eyebrow="Everyday pieces"
              title="Bangles & bracelets"
              body="Lightweight 18K gold, made for daily wear and dispatched within 48 hours."
              href="/products?category=bracelets"
            />
            <div className="mt-7">
              <ProductRail products={flattenVariants(bracelets)} />
            </div>
          </div>
        </section>
      </Reveal>

      {/* 10. Consultation CTA */}
      <Reveal>
        <ConsultationCta business={NAV_DATA.business} />
      </Reveal>

      {/* 11. Testimonials Section */}
      <Reveal>
        <Testimonials items={testimonials} />
      </Reveal>

      {/* 12. Final CTA */}
      <FinalCta />

      {/* 13. FAQ Accordion Section */}
      <Reveal>
        <section className="shell gutter py-12 sm:py-16 lg:py-20">
          <div className="lg:grid lg:grid-cols-[0.9fr_1.4fr] lg:items-start lg:gap-14">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions we get asked"
              body="Still unsure? Message us on WhatsApp — a jewellery expert replies, not a bot."
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
      </Reveal>
    </>
  );
}
