import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { Reveal } from "@/components/public/ui/reveal";
import { getProductsByCategory } from "@/lib/services/product-service";
import { gemColorFor } from "@/lib/utils";

/** Asymmetric two-panel promo — a large "the collection" feature plus a
 * smaller single-category spotlight, matching the brand mockup's split
 * banner directly under Shop by Category. */
export async function CollectionSplit() {
  const [necklaces, rings] = await Promise.all([
    getProductsByCategory("necklaces"),
    getProductsByCategory("rings"),
  ]);
  const feature = necklaces[0];
  const spotlight = rings[0];

  return (
    <section className="shell gutter py-4">
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Reveal>
          <Link
            href="/products"
            className="group relative flex min-h-96 flex-col justify-end overflow-hidden bg-plum-950 p-7 text-ivory-100 sm:p-10"
          >
            <Image
              src="/images/tradition-banner.png"
              alt="Tradition Banner Image"
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105"
            />
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <Link
            href="/products?category=rings"
            className="group relative flex min-h-96 flex-col justify-end overflow-hidden bg-ivory-200 p-7 text-plum-950 sm:p-8"
          >
            <Image
              src="/images/ring-banner.png"
              alt="Ring Banner Image"
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
