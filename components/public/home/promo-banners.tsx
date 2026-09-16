"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { cn } from "@/lib/utils";

/**
 * §27 Banner Flow — banner type "Promotional". These become CMS-scheduled,
 * reorderable documents in Phase 14; the slide shape below is what the admin
 * form will fill.
 */
const banners = [
  {
    eyebrow: "Bridal edit",
    title: "Kundan & diamond bridal sets",
    body: "Chokers, necklaces and bangles made for the big day — and the years after it.",
    cta: "Explore bridal",
    href: "/products?category=necklaces",
    from: "#6E3C75",
    to: "#26002f",
  },
  {
    eyebrow: "Everyday gold",
    title: "Bangles & bracelets under ₹30,000",
    body: "Lightweight 18K gold, made for daily wear and dispatched within 48 hours.",
    cta: "Shop bracelets",
    href: "/products?category=bracelets",
    from: "#4A0B52",
    to: "#2f0338",
  },
  {
    eyebrow: "Statement pieces",
    title: "Rings that hold their own",
    body: "Solitaires, bands and temple-motif rings, hallmarked and finished by hand.",
    cta: "Shop rings",
    href: "/products?category=rings",
    from: "#98732E",
    to: "#2f0338",
  },
  {
    eyebrow: "Free with every order",
    title: "Talk to a jewellery consultant first",
    body: "Not sure what suits the occasion or your budget? Get an honest opinion before you spend a rupee.",
    cta: "Start a conversation",
    href: "/contact",
    from: "#d9a441",
    to: "#410849",
  },
];

const AUTOPLAY_MS = 5500;

export function PromoBanners() {
  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLUListElement>(null);
  const pausedRef = React.useRef(false);

  const goTo = React.useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;

    // Scroll the track itself, not scrollIntoView — that walks every
    // scrollable ancestor including the page, so autoplaying while the user
    // has scrolled away from the carousel would yank the whole page back up.
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, []);

  // Keep the dots and active slide in sync with whatever scrolled the track —
  // autoplay, a swipe, or a dot click all funnel through the same observer.
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );

    for (const child of Array.from(track.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (pausedRef.current) return;
      goTo((active + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(interval);
  }, [active, goTo]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  return (
    <section className="shell gutter pb-2 sm:pb-4">
      <div
        className="group relative overflow-hidden rounded-2xl"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <ul
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        >
          {banners.map((banner, i) => (
            <li
              key={banner.href + banner.title}
              data-index={i}
              className="w-full shrink-0 snap-center"
            >
              <Link
                href={banner.href}
                className="relative flex min-h-56 flex-col justify-end p-5 text-ivory-100 sm:min-h-64 sm:p-8 lg:min-h-72"
                style={{
                  background: `linear-gradient(135deg, ${banner.from} 0%, ${banner.to} 72%)`,
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full opacity-40 blur-2xl"
                  style={{ background: banner.from }}
                />

                <div className="relative max-w-md">
                  <p className="text-[0.625rem] font-semibold tracking-[0.18em] text-gold-300 uppercase">
                    {banner.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl leading-tight font-semibold sm:text-3xl">
                    {banner.title}
                  </h3>
                  <p className="mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-white/75 sm:text-sm">
                    {banner.body}
                  </p>
                  <span
                    className={buttonStyles({
                      variant: "outline",
                      size: "sm",
                      className:
                        "mt-5 border-white/25 bg-white/10 text-ivory-100 hover:border-white/50 hover:bg-white/18",
                    })}
                  >
                    {banner.cta}
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Arrows — pointer input only, so they don't compete with the swipe gesture on touch. */}
        <button
          type="button"
          onClick={() => goTo((active - 1 + banners.length) % banners.length)}
          aria-label="Previous banner"
          className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-plum-950/40 text-ivory-100 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 sm:flex hover:bg-plum-950/60"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => goTo((active + 1) % banners.length)}
          aria-label="Next banner"
          className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-plum-950/40 text-ivory-100 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 sm:flex hover:bg-plum-950/60"
        >
          <ArrowRight size={18} />
        </button>

        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {banners.map((banner, i) => (
            <button
              key={banner.href + banner.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                active === i ? "w-6 bg-gold-400" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
