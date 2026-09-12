"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { OrnamentalDivider } from "@/components/public/ui/ornamental-divider";
import { cn } from "@/lib/utils";

export function RashiFinder({ rashiList, categories }: { rashiList: any[], categories: any[] }) {
  const [selected, setSelected] = React.useState(rashiList[0]?.slug);
  const rashi = rashiList.find((r) => r.slug === selected) ?? rashiList[0];
  const category = rashi?.categorySlug
    ? categories.find(c => c.slug === rashi.categorySlug)
    : undefined;

  if (!rashiList || rashiList.length === 0) return null;

  return (
    <section className="bg-ivory-200 py-12 sm:py-16 lg:py-20">
      <div className="shell gutter">
        <OrnamentalDivider className="mb-5" />
        <div className="text-center">
          <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-gold-700 uppercase">
            Rashi Ratna
          </p>
          <h2 className="mt-2 font-display text-[1.75rem] leading-[1.15] font-semibold text-plum-900 sm:text-4xl">
            Find your gemstone by rashi
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-muted">
            Traditional Vedic astrology recommends one primary stone per moon
            sign. Tap yours to see it.
          </p>
        </div>

        {/* Rashi chip rail — swipeable on mobile, wraps on desktop. */}
        <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
          {rashiList.map((r) => (
            <li key={r.slug} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setSelected(r.slug)}
                aria-pressed={selected === r.slug}
                className={cn(
                  "flex min-w-[4.75rem] flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 transition-colors",
                  selected === r.slug
                    ? "border-gold-500 bg-gold-500 text-plum-950"
                    : "border-plum-900/12 bg-white text-plum-800 hover:border-gold-400",
                )}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {r.symbol}
                </span>
                <span
                  className={cn(
                    "text-[0.625rem] leading-none text-sm",
                    selected === r.slug ? "text-plum-800" : "text-ink-muted",
                  )}
                >
                  {r.english}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Result card */}
        <div className="mx-auto mt-8 max-w-xl overflow-hidden rounded-2xl border border-gold-500/25 bg-white">
          <div className="flex items-center gap-4 bg-plum-950 p-5 text-ivory-100">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gold-500/15 text-3xl">
              {rashi.symbol}
            </span>
            <div className="min-w-0">
              <p className="text-xl leading-none">{rashi.transliteration}</p>
              <p className="mt-1.5 text-sm text-plum-300">
                {rashi.english} · {rashi.dateRange}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-gold-700 uppercase">
              Ruling planet
            </p>
            <p className="mt-1 text-plum-900">
              {rashi.planet}{" "}
            </p>

            <p className="mt-4 text-[0.6875rem] font-semibold tracking-[0.14em] text-gold-700 uppercase">
              Recommended stone
            </p>
            <p className="mt-1 text-lg font-semibold text-plum-900">
              {rashi.stoneName}
            </p>

            {category ? (
              <Link
                href={`/products?category=${category.slug}`}
                className={buttonStyles({
                  size: "md",
                  full: true,
                  className: "mt-5",
                })}
              >
                Shop {category.name.split(" / ")[1] ?? category.name}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <p className="mt-5 rounded-xl bg-ivory-200 px-4 py-3 text-[0.8125rem] leading-relaxed text-plum-800">
                We don&rsquo;t currently stock this stone.{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-gold-700 underline underline-offset-2"
                >
                  Ask us to source it
                </Link>{" "}
                for you.
              </p>
            )}

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <Info size={14} className="mt-0.5 shrink-0" />A general reference,
              not personal advice — birth chart, ascendant and current dashas
              can change what is right for you. Please consult your astrologer
              before purchase.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
