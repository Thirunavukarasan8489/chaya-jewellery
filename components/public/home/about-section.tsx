import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { SectionHeading } from "@/components/public/ui/section-heading";

export function AboutSection() {
  return (
    <section className="shell gutter py-12 sm:py-16 lg:py-20">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="order-2 lg:order-1">
          <SectionHeading
            eyebrow="About us"
            title="Eighteen years, one rule"
            body="Chaya Jewellery began in 2007 as a small counter in Mylapore, buying rough at source and cutting in-house. What has not changed is the rule we started with: never sell a stone you would not be happy to buy back."
          />
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
            Today we work directly with cutters in Mogok, Ratnapura and Jaipur,
            and every stone above ₹25,000 goes to an independent laboratory
            before it reaches the catalogue. We hold the report, you hold the
            number.
          </p>
          <Link
            href="/about"
            className={buttonStyles({ variant: "dark", className: "mt-7" })}
          >
            Read our story
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="order-1 grid grid-cols-2 gap-3 sm:gap-4 lg:order-2">
          <GemImage
            color="#c81e4a"
            seed={2}
            className="aspect-4/5 w-full rounded-2xl"
          />
          <div className="grid gap-3 sm:gap-4">
            <GemImage
              color="#0f9c68"
              seed={7}
              className="aspect-square w-full rounded-2xl"
            />
            <GemImage
              color="#1f4fd8"
              seed={11}
              className="aspect-square w-full rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
