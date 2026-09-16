import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { GemImage } from "@/components/public/ui/gem-image";
import { Reveal } from "@/components/public/ui/reveal";
import { getCategories } from "@/lib/services/category-service";
import { categoryTerms, gemColorFor } from "@/lib/utils";

export async function FeaturedCategories() {
  const categories = await getCategories();

  return (
    <section id="shop-by-category" className="shell gutter py-10 sm:py-16 lg:py-20">
      <SectionHeading
        eyebrow="Category"
        title="Shop by Category"
        body="Rings, necklaces, earrings and more — handcrafted in gold and finished to order."
        href="/products"
        align="center"
      />

      <ul className="no-scrollbar mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-hidden px-1 pb-1 sm:gap-6 lg:flex-wrap lg:justify-center lg:overflow-visible lg:gap-x-8 lg:gap-y-6">
        {categories.map((cat, i) => {
          const terms = categoryTerms(cat.name);

          return (
            <li key={cat.slug} className="shrink-0 snap-start">
              <Reveal delay={i * 60}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="group flex w-20 flex-col items-center gap-2.5 sm:w-24"
                >
                  <span className="relative block size-20 shrink-0 overflow-hidden rounded-full ring-1 ring-ivory-300 transition-[box-shadow,ring-color] duration-300 group-hover:shadow-md group-hover:ring-gold-400 sm:size-24">
                    {cat.image ? (
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        width={192}
                        height={192}
                        priority={i < 6}
                        loading={i < 6 ? undefined : "lazy"}
                        className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110"
                      />
                    ) : (
                      <GemImage
                        color={cat.gemColor || gemColorFor(cat.slug)}
                        seed={i * 5 + 1}
                        vignette={false}
                        className="size-full transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110"
                      />
                    )}
                  </span>
                  <span className="text-center text-[0.6875rem] leading-tight font-semibold tracking-[0.06em] text-plum-900 uppercase">
                    {terms.primary}
                  </span>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
