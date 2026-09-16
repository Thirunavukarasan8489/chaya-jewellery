import { BridalGiftsSplit } from "@/components/public/home/bridal-gifts-split";
import { CollectionSplit } from "@/components/public/home/collection-split";
import { CraftedForGenerations } from "@/components/public/home/crafted-for-generations";
import { FeaturedCategories } from "@/components/public/home/featured-categories";
import { HeroSlider } from "@/components/public/home/hero-slider";
import { Testimonials } from "@/components/public/home/testimonials";
import { TrustStrip } from "@/components/public/home/trust-strip";
import { ProductRail } from "@/components/public/product/product-rail";
import { Reveal } from "@/components/public/ui/reveal";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { getTestimonials } from "@/lib/services/content-service";
import { getCategories } from "@/lib/services/category-service";
import { getBestsellers } from "@/lib/services/product-service";
import { getHeroSections } from "@/lib/actions/cms.actions";
import { flattenVariants } from "@/lib/utils";

export default async function HomePage() {
  const [bestsellers, categories, sectionsRes, testimonials] = await Promise.all([
    getBestsellers(),
    getCategories(),
    getHeroSections(),
    getTestimonials(),
  ]);

  const banners = sectionsRes.success && Array.isArray(sectionsRes.data) ? sectionsRes.data.filter((s: any) => s.isActive) : undefined;

  const averageRating = testimonials.length
    ? testimonials.reduce((sum: number, t: any) => sum + (t.rating || 0), 0) / testimonials.length
    : undefined;

  return (
    <>
      {/* 1. Hero Image Banner Slider Section */}
      <HeroSlider categories={categories} banners={banners} />

      {/* 2. Shop by Category */}
      <FeaturedCategories />

      {/* 3. The Chaya Collection — split promo */}
      <CollectionSplit />

      {/* 4. Bestsellers */}
      <Reveal>
        <section className="shell gutter py-12 sm:py-16 lg:py-20">
          <SectionHeading
            eyebrow="Bestsellers"
            title="Loved by thousands. Chosen for a lifetime."
            href="/products?sort=popular"
          />
          <div className="mt-7">
            <ProductRail products={flattenVariants(bestsellers)} />
          </div>
        </section>
      </Reveal>

      {/* 5. Crafted for Generations — editorial */}
      <CraftedForGenerations />

      {/* 6. Trust strip */}
      <TrustStrip averageRating={averageRating} />

      {/* 7. Bridal Edit + Gifts — split promo */}
      <BridalGiftsSplit />

      {/* 8. Testimonials */}
      <Reveal>
        <Testimonials items={testimonials} />
      </Reveal>
    </>
  );
}
