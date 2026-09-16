import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { Reveal } from "@/components/public/ui/reveal";
import { gemColorFor } from "@/lib/utils";
import Image from "next/image";

/** Editorial image+text split — matches the brand mockup's "Crafted for
 * Generations" section, sitting between Bestsellers and the trust strip. */
export function CraftedForGenerations() {
  return (
    <section className="bg-gold-50 py-14 sm:py-20 lg:py-24">
      <div className="shell gutter grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
            Our promise
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-plum-950 sm:text-4xl lg:text-5xl">
            Crafted for Generations
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-plum-700 sm:text-base">
            Jewellery that celebrates your today and tomorrow — hallmarked gold,
            certified stones, and a finish inspected by hand before it ever
            reaches you.
          </p>
          <Link
            href="/about"
            className={buttonStyles({
              size: "lg",
              className: "mt-8 font-semibold",
            })}
          >
            Our Story
            <ArrowRight size={17} />
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative aspect-4/3 overflow-hidden shadow-lg">
            <Image
              src="/images/our-story.jpeg"
              alt="Crafted for Generations"
              fill
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-950/85 via-plum-950/10 to-transparent p-5 sm:p-7">
              <p className="font-display text-base text-ivory-100 italic sm:text-lg">
                &ldquo;More Than Jewellery, A Part of You&rdquo;
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
