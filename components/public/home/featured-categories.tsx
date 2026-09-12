import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { GemImage } from "@/components/public/ui/gem-image";
import { getCategories } from "@/lib/services/category-service";
import { getProducts } from "@/lib/services/product-service";
import { categoryTerms } from "@/lib/utils";

export async function FeaturedCategories() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <section
      id="shop-by-category"
      className="shell gutter py-10 sm:py-16 lg:py-20"
    >
      <SectionHeading
        eyebrow="Category"
        title="Shop by Category"
        body="Explore our natural gemstone categories sourced directly from origin deposits."
        href="/products"
      />

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {categories.map((cat, i) => {
          const count = products.filter(
            (p) =>
              (p.categorySlug === cat.slug ||
                p.categorySlug === cat.slug.toLowerCase()) &&
              p.published,
          ).length;
          const terms = categoryTerms(cat.name);

          return (
            <li key={cat.slug}>
              <Link
                href={`/products?category=${cat.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-plum-950"
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={500}
                    height={500}
                    priority={i < 4}
                    loading={i < 4 ? undefined : "lazy"}
                    className="aspect-square w-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-105"
                  />
                ) : (
                  <GemImage
                    color={cat.gemColor}
                    seed={i * 5 + 1}
                    className="aspect-square w-full transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-105"
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-950/90 via-plum-950/45 to-transparent p-3 pt-10 sm:p-4">
                  <p className="font-display text-base leading-tight font-semibold text-ivory-100 sm:text-lg capitalize">
                    {terms.primary}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[0.6875rem] text-plum-300">
                    {terms.secondary && <span>{terms.secondary} ·</span>}
                    {count > 0
                      ? `${count} ${count === 1 ? "piece" : "pieces"}`
                      : "In Stock"}
                  </p>
                </div>

                <span className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/15 text-ivory-100 backdrop-blur-sm transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-plum-950">
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
