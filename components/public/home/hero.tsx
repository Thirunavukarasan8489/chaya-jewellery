import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { OrnamentalBg } from "@/components/public/ui/ornamental-bg";



import { categoryTerms, NAV_DATA, whatsappLink } from "@/lib/utils";

const tilt = ["-rotate-4 lg:-translate-y-2", "rotate-0 -translate-y-6", "rotate-4 lg:-translate-y-1"];

const stats = [{ value: "50+", label: "Years of Trust" },{ value: "100%", label: "Certified Natural" },{ value: "10k+", label: "Happy Customers" },{ value: "5/5", label: "Google Reviews" }];
export async function Hero({ categories }: { categories: any[] }) {
  const business = NAV_DATA.business;
  return (
    <section className="relative overflow-hidden bg-plum-950 text-ivory-100">
      <OrnamentalBg glowPosition="30% 10%" />

      <div className="shell gutter relative py-14 sm:py-20 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:py-24">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-none border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] uppercase">
            <BadgeCheck size={14} className="text-gold-400" />
            <span className="text-foil">
              GIA · IGI · GRS · SSEF
            </span>
          </p>

          <h1 className="mt-6 text-[2.5rem] leading-[1.06] font-semibold sm:text-6xl lg:text-[4.25rem]">
            Stones you can
            <br />
            <span className="text-foil">verify</span>, not just admire.
          </h1>

          <p className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-plum-200 sm:text-lg">
            Every gemstone we sell carries an independent laboratory report, and
            every treatment is disclosed on the page. You get the certificate
            number before you pay — verify it yourself.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className={buttonStyles({ size: "lg", className: "sm:w-auto" })}
            >
              Explore the collection
              <ArrowRight size={18} />
            </Link>
            <a
              href={whatsappLink(business, 
                "Hi Chaya Jewellery, I would like a free gemmologist consultation.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({
                variant: "outline",
                size: "lg",
                className:
                  "border-ivory-100/25 bg-white/8 text-ivory-100 hover:border-ivory-100/50 hover:bg-white/14 sm:w-auto",
              })}
            >
              <MessageCircle size={18} />
              Free consultation
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/10 pt-7 sm:grid-cols-4">
            {stats.map((stat: any, i: number) => (
              <div
                key={stat.label}
                className={i > 0 ? "border-l border-white/10 pl-3" : ""}
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-xl font-semibold text-gold-300 tabular-nums sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-[0.625rem] leading-tight text-plum-300 sm:text-xs">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Gem cluster — fanned out like stones set on a display cushion, not a
            flat 3-up grid. Each card gets a gold bezel and its own tilt. */}
        <div className="relative mt-16 lg:mt-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
            style={{
              background:
                "radial-gradient(55% 55% at 50% 45%, rgba(221,182,58,.28), transparent 70%)",
            }}
          />

          <ul className="grid grid-cols-3 gap-3 lg:gap-5">
            {categories.slice(0, 3).map((cat: any, i: number) => {
              const terms = categoryTerms(cat.name);
              return (
                <li
                  key={cat.slug}
                  className="animate-rise"
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  <Link
                    href={`/collections/${cat.slug}`}
                    className={`group block overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 ease-out-soft hover:-translate-y-1.5 hover:rotate-0! ${tilt[i]}`}
                  >
                    <GemImage
                      color={cat.gemColor}
                      seed={i * 3}
                      framed
                      className="aspect-3/4 w-full transition-transform duration-500 ease-out-soft group-hover:scale-105"
                    />
                    <p className="bg-ivory-50 px-2 py-2.5 text-center leading-tight text-plum-900">
                      <span className="block font-display text-sm font-semibold sm:text-base">
                        {terms.primary}
                      </span>
                      {terms.secondary && (
                        <span className="text-[0.5625rem] tracking-wide text-gold-700 uppercase">
                          {terms.secondary}
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
