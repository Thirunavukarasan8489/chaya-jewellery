import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { OrnamentalBg } from "@/components/public/ui/ornamental-bg";
import { OrnamentalDivider } from "@/components/public/ui/ornamental-divider";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-plum-950 py-16 text-center text-ivory-100 sm:py-20 lg:py-24">
      <OrnamentalBg glowPosition="50% 100%" />

      <div className="shell gutter relative">
        <OrnamentalDivider onDark className="mb-5" />
        <p className="text-[0.6875rem] font-semibold tracking-[0.2em] uppercase">
          <span className="text-foil">Ready when you are</span>
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-[2rem] leading-[1.1] font-semibold sm:text-5xl">
          Own a stone with a name, an origin and a report.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-plum-200">
          Browse the catalogue, or tell us what you are looking for and we will
          find it.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/products"
            className={buttonStyles({ size: "lg", className: "sm:w-auto" })}
          >
            Shop all gemstones
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/contact"
            className={buttonStyles({
              variant: "outline",
              size: "lg",
              className:
                "border-ivory-100/25 bg-white/8 text-ivory-100 hover:border-ivory-100/50 hover:bg-white/14 sm:w-auto",
            })}
          >
            Send an enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
