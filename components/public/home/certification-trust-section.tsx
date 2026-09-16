import Link from "next/link";
import { Award, BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { OrnamentalDivider } from "@/components/public/ui/ornamental-divider";
import { Reveal } from "@/components/public/ui/reveal";

const marks = [
  { label: "BIS", sub: "HALLMARK GOLD" },
  { label: "IGI", sub: "CERTIFIED DIAMONDS" },
  { label: "925", sub: "STERLING SILVER" },
  { label: "COA", sub: "CERTIFICATE INCLUDED" },
];

const points = [
  {
    icon: ShieldCheck,
    title: "Hallmarked purity",
    body: "Every gold piece carries a BIS hallmark stating its purity — nothing left to trust on our word alone.",
  },
  {
    icon: Award,
    title: "Certificate with every order",
    body: "A certificate of authenticity ships with your piece, and diamonds above a carat threshold carry an independent IGI report.",
  },
  {
    icon: Sparkles,
    title: "Made to order, checked by hand",
    body: "Each piece is inspected for finish and weight before it leaves our workshop — not just before it's photographed.",
  },
];

export function CertificationTrustSection() {
  return (
    <section className="relative w-full max-w-full overflow-hidden bg-ivory-200 py-14 sm:py-20 lg:py-24">
      <div className="shell gutter">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">
              Craftsmanship &amp; trust
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-plum-950 sm:text-4xl lg:text-5xl">
              Made to last, backed on paper
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-plum-700 sm:text-base">
              Fine jewellery is a promise as much as a purchase. Every piece
              we make is hallmarked, documented and checked by hand before it
              reaches you.
            </p>

            <ol className="mt-8 space-y-5">
              {points.map((p, i) => {
                const Icon = p.icon;
                return (
                  <li key={p.title} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-none bg-plum-900 text-gold-400 ring-1 ring-gold-500/30">
                      <Icon size={17} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-plum-950 sm:text-base">
                        {p.title}
                      </h3>
                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-plum-700 sm:text-sm">
                        {p.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-9 flex flex-wrap justify-start gap-4">
              <Link
                href="/about"
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-plum-300 bg-white text-plum-950 hover:bg-plum-900 hover:text-ivory-100 font-semibold px-6",
                })}
              >
                Our story
              </Link>
              <Link
                href="/products"
                className={buttonStyles({
                  size: "lg",
                  className: "font-semibold px-8 shadow-md",
                })}
              >
                Shop now
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-plum-950 p-8 text-center shadow-xl sm:p-10">
              <OrnamentalDivider onDark className="mb-6" />
              <span className="inline-flex items-center gap-2 rounded-none border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-gold-300 uppercase">
                <BadgeCheck size={14} />
                Every piece, verified
              </span>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {marks.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-white/12 bg-white/5 px-3 py-4"
                  >
                    <p className="font-display text-lg font-bold tracking-wider text-ivory-100">
                      {m.label}
                    </p>
                    <p className="mt-1 text-[0.625rem] font-medium tracking-wide text-plum-300">
                      {m.sub}
                    </p>
                  </div>
                ))}
              </div>
              <OrnamentalDivider onDark className="mt-6" />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
