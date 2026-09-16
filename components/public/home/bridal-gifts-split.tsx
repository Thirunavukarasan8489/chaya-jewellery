import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { Reveal } from "@/components/public/ui/reveal";
import { gemColorFor } from "@/lib/utils";
import Image from "next/image";

const PANELS = [
  {
    eyebrow: "Bridal Edit",
    title: "For Your Forever",
    body: "Exquisite designs for your most precious moments.",
    cta: "Explore Bridal",
    href: "/products?category=necklaces",
    color: gemColorFor("bridal-edit"),
    dark: true,
    img: "/images/birdal-edit.png",
  },
  {
    eyebrow: "Gifts",
    title: "That Speak From the Heart",
    body: "Make every order memorable.",
    cta: "Explore Gifts",
    href: "/contact",
    color: gemColorFor("gifts"),
    dark: false,
    img: "/images/gifts.png",
  },
];

/** Two-panel bridal + gifting promo, matching the brand mockup. */
export function BridalGiftsSplit() {
  return (
    <section className="shell gutter py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {PANELS.map((panel, i) => (
          <Reveal key={panel.eyebrow} delay={i * 90}>
            <Link
              href={panel.href}
              className={`group relative flex min-h-56 flex-col justify-end overflow-hidden p-7 sm:min-h-64 sm:p-8 ${
                panel.dark
                  ? "bg-plum-950 text-ivory-100"
                  : "bg-ivory-200 text-plum-950"
              }`}
            >
              {/* <GemImage
                color={panel.color}
                seed={i * 11 + 2}
                vignette={false}
                className={`absolute inset-0 h-full w-full transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105 ${
                  panel.dark ? "opacity-60" : "opacity-90"
                }`}
              /> */}
              <Image
                src={panel.img}
                alt={panel.title}
                fill
                className="object-cover"
              />
              {/* <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-t ${
                  panel.dark
                    ? "from-plum-950 via-plum-950/55 to-transparent"
                    : "from-ivory-200 via-ivory-200/50 to-transparent"
                }`}
              /> */}
              {/* <div className="relative max-w-xs">
                <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-gold-600 uppercase">
                  {panel.eyebrow}
                </p>
                <h3 className="mt-2 font-display text-xl leading-tight font-semibold sm:text-2xl">
                  {panel.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {panel.body}
                </p>
                <span
                  className={buttonStyles({
                    variant: panel.dark ? "primary" : "dark",
                    size: "sm",
                    className: "mt-5 font-semibold",
                  })}
                >
                  {panel.cta}
                  <ArrowRight size={15} />
                </span>
              </div> */}
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
