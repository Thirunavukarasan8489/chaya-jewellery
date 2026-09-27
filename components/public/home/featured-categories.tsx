import { SectionHeading } from "@/components/public/ui/section-heading";
import { Reveal } from "@/components/public/ui/reveal";
import { getFeaturedCategoriesWithSubs } from "@/lib/services/category-service";
import { FeaturedCategoriesClient } from "./featured-categories-client";

export async function FeaturedCategories() {
  const categories = await getFeaturedCategoriesWithSubs();

  return (
    <section
      id="shop-by-category"
      className="shell gutter py-10 sm:py-16 lg:py-20"
    >
      <Reveal>
        <SectionHeading
          eyebrow="Category"
          title="Shop by Category"
          body="Rings, necklaces, earrings and more — handcrafted in gold and finished to order."
          href="/products"
          align="center"
        />

        <FeaturedCategoriesClient categories={categories} />
      </Reveal>
    </section>
  );
}

