import Link from "next/link";
import { BadgeCheck, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import Image from "next/image";

export function CertificationTrustSection() {
  return (
    <section className="relative w-full max-w-full overflow-hidden bg-ivory-200 py-14 sm:py-20 lg:py-24">
      <div className="shell gutter">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* <div className="relative mx-auto w-full max-w-xl">
            <div className="relative overflow-hidden rounded-2xl border border-ivory-300 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-ivory-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-plum-950 text-gold-400 font-bold text-xs tracking-wider">
                    GRS
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold tracking-wider text-plum-950 uppercase">
                      Gemresearch Swisslab
                    </h4>
                    <p className="text-[0.6875rem] text-plum-600">
                      GEMSTONE REPORT · RAPPORT DE PIERRE PRÉCIEUSE
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[0.6875rem] font-semibold text-emerald-800 flex items-center gap-1">
                  <BadgeCheck size={14} /> Verified
                </span>
              </div>
              <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-4">
                <div className="space-y-2 text-xs text-plum-900">
                  <div className="flex justify-between border-b border-ivory-100 pb-1">
                    <span className="text-plum-600 font-medium">
                      Report No:
                    </span>
                    <span className="font-semibold">GRS2026-100600</span>
                  </div>
                  <div className="flex justify-between border-b border-ivory-100 pb-1">
                    <span className="text-plum-600 font-medium">Object:</span>
                    <span className="font-semibold">One faceted gemstone</span>
                  </div>
                  <div className="flex justify-between border-b border-ivory-100 pb-1">
                    <span className="text-plum-600 font-medium">
                      Identification:
                    </span>
                    <span className="font-semibold text-emerald-700">
                      Natural Emerald
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-ivory-100 pb-1">
                    <span className="text-plum-600 font-medium">Weight:</span>
                    <span className="font-semibold">5.39 ct</span>
                  </div>
                  <div className="flex justify-between border-b border-ivory-100 pb-1">
                    <span className="text-plum-600 font-medium">
                      Dimensions:
                    </span>
                    <span className="font-semibold">
                      12.12 x 9.25 x 6.58 mm
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-ivory-100 pb-1">
                    <span className="text-plum-600 font-medium">Color:</span>
                    <span className="font-semibold text-emerald-700">
                      Vivid Green
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-plum-600 font-medium">Origin:</span>
                    <span className="font-semibold">Zambia</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl bg-plum-950 p-4 text-center text-ivory-100">
                  <div className="size-16 rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/40 flex items-center justify-center mb-3">
                    <div className="size-10 rounded-full bg-emerald-600 shadow-inner" />
                  </div>
                  <p className="text-[0.6875rem] font-semibold tracking-wider text-gold-300 uppercase">
                    Natural & Unheated
                  </p>
                  <p className="text-xs text-plum-300 mt-1">
                    No Thermal Treatment
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-ivory-200 pt-4">
                <div className="font-mono text-[0.6875rem] tracking-widest text-plum-600">
                  ||||| ||||||| |||| |||||||| |||
                  <span className="block text-[0.625rem] text-plum-500">
                    2026-100600-GRS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-plum-900">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>100% Origin Guaranteed</span>
                </div>
              </div>
            </div>
          </div> */}
          <div className="relative mx-auto w-full max-w-xl">
            <Image
              src="/images/grsss-bg-img-040324.png"
              alt="Certificate"
              width={1536}
              height={1024}
            />
          </div>

          {/* Right Column: Text & Lab Logos */}
          <div className="flex flex-col text-center lg:text-left">
            <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">
              100% Certified Authenticity
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-plum-950 sm:text-4xl lg:text-5xl">
              Certified Stones
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-plum-700 sm:text-base">
              Every single gemstone in our inventory carries an independent lab
              report from world-renowned gemmological institutes. Verify
              certificate numbers online prior to purchase.
            </p>

            {/* Lab Badges Grid */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div className="flex items-center gap-2 rounded-xl border border-ivory-300 bg-white px-4 py-2.5 shadow-xs">
                <span className="font-bold text-xs tracking-wider text-plum-900">
                  GJEPC
                </span>
                <span className="text-[0.625rem] font-medium text-plum-600">
                  INDIA
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-ivory-300 bg-white px-4 py-2.5 shadow-xs">
                <span className="font-bold text-xs tracking-wider text-plum-900">
                  IGI
                </span>
                <span className="text-[0.625rem] font-medium text-plum-600">
                  INTERNATIONAL
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-ivory-300 bg-white px-4 py-2.5 shadow-xs">
                <span className="font-bold text-xs tracking-wider text-red-600">
                  GRS
                </span>
                <span className="text-[0.625rem] font-medium text-plum-600">
                  SWISSLAB
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-ivory-300 bg-white px-4 py-2.5 shadow-xs">
                <span className="font-bold text-xs tracking-wider text-plum-950">
                  GIA
                </span>
                <span className="text-[0.625rem] font-medium text-plum-600">
                  CERTIFIED
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
              <Link
                href="/about"
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-plum-300 bg-white text-plum-950 hover:bg-plum-900 hover:text-ivory-100 font-semibold px-6",
                })}
              >
                READ MORE
              </Link>
              <Link
                href="/products"
                className={buttonStyles({
                  size: "lg",
                  className:
                    "bg-plum-950 text-ivory-100 hover:bg-plum-900 font-semibold px-8 shadow-md",
                })}
              >
                SHOP NOW
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
