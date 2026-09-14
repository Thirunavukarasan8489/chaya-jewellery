"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, BadgeCheck, MessageCircle } from "lucide-react";
import { buttonStyles } from "@/components/public/ui/button";
import { GemImage } from "@/components/public/ui/gem-image";
import { cn } from "@/lib/utils";

/**
 * Hero banner carousel. Every field below is optional except the image
 * itself — a slide can be a plain, fully-clickable banner image (the kind
 * a designer hands over as one finished creative, badge/offer baked in),
 * or that same image with our own badge/title/subtitle/button overlay on
 * top. HeroSlider only renders what the admin actually filled in via
 * /admin/website/hero-section; nothing here is a forced placeholder.
 */
const AUTOPLAY_MS = 6000;

// Placeholder-art accent, cycled by index, for slides with no uploaded image.
const SLIDE_ACCENTS = ["#D6A04F", "#8B4A9B", "#5A1766"];

type Slide = {
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  gemColor: string;
  image?: string;
};

function HeroSlide({ slide, index }: { slide: Slide; index: number }) {
  const hasCaption = Boolean(slide.badge || slide.title || slide.subtitle);
  const hasPrimaryCta = Boolean(slide.ctaText && slide.ctaHref);
  const hasSecondaryCta = Boolean(slide.secondaryCtaText && slide.secondaryCtaHref);
  const hasOverlay = hasCaption || hasPrimaryCta || hasSecondaryCta;
  // A pure image banner (no caption, no buttons) links out entirely on
  // click instead of needing a button drawn on top of it.
  const wholeSlideHref = !hasOverlay ? slide.ctaHref : undefined;

  return (
    <div className="relative min-h-75 w-full overflow-hidden bg-plum-950 sm:min-h-[440px] lg:min-h-[520px]">
      {slide.image ? (
        <Image
          src={slide.image}
          alt={slide.title || "Chaya Jewellery"}
          fill
          priority={index === 0}
          sizes="100vw"
          // object-contain on mobile: the slide box (390x360-ish, ~1.1:1) is
          // much taller/narrower than a typical wide banner creative (this
          // one is 1600x800, 2:1), so object-cover was scaling the image up
          // to fill the box height and cropping ~46% of its width — cutting
          // off exactly the corner ribbon/offer text a designer-provided
          // banner tends to put near the edges. object-cover from lg: up,
          // where the box is wide enough that cover only trims a little dead
          // vertical margin instead of live content. bg-plum-950 above fills
          // the letterbox bars contain leaves on mobile.
          className="object-contain lg:object-cover"
        />
      ) : (
        <GemImage
          color={slide.gemColor}
          seed={index * 7 + 1}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {hasOverlay && (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-plum-950/90 via-plum-950/25 to-transparent"
        />
      )}

      {hasOverlay && (
        <div className="shell gutter absolute inset-0 z-10 flex flex-col justify-end pb-9 sm:pb-12 lg:pb-16">
          <div className="animate-rise max-w-2xl">
            {slide.badge && (
              <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-gold-300 uppercase">
                <BadgeCheck size={14} className="text-gold-400" />
                <span>{slide.badge}</span>
              </p>
            )}

            {slide.title && (
              <h1 className="mt-5 text-3xl leading-[1.1] font-semibold text-ivory-100 sm:text-5xl lg:text-6xl">
                {slide.title}
              </h1>
            )}

            {slide.subtitle && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-plum-200 sm:text-base lg:text-lg">
                {slide.subtitle}
              </p>
            )}

            {(hasPrimaryCta || hasSecondaryCta) && (
              <div className="mt-7 flex flex-wrap gap-3">
                {hasPrimaryCta && (
                  <Link
                    href={slide.ctaHref!}
                    className={buttonStyles({
                      size: "lg",
                      className: "sm:w-auto font-semibold shadow-lg",
                    })}
                  >
                    {slide.ctaText}
                    <ArrowRight size={18} />
                  </Link>
                )}

                {hasSecondaryCta && (
                  <Link
                    href={slide.secondaryCtaHref!}
                    className={buttonStyles({
                      variant: "outline",
                      size: "lg",
                      className:
                        "border-ivory-100/25 bg-white/10 text-ivory-100 hover:border-ivory-100/50 hover:bg-white/15 sm:w-auto",
                    })}
                  >
                    <MessageCircle size={18} />
                    {slide.secondaryCtaText}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {wholeSlideHref && (
        <Link href={wholeSlideHref} className="absolute inset-0">
          <span className="sr-only">{slide.title || "View banner"}</span>
        </Link>
      )}
    </div>
  );
}

export function HeroSlider({ banners }: { categories?: any[]; banners?: any[] }) {
  const activeSlides: Slide[] = banners
    ? banners.map((b, i) => ({
        badge: b.badge,
        title: b.title,
        subtitle: b.subtitle,
        ctaText: b.ctaText,
        ctaHref: b.ctaHref,
        secondaryCtaText: b.secondaryCtaText,
        secondaryCtaHref: b.secondaryCtaHref,
        gemColor: SLIDE_ACCENTS[i % SLIDE_ACCENTS.length],
        image: b.image,
      }))
    : [];

  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLUListElement>(null);
  const pausedRef = React.useRef(false);
  const isCarousel = activeSlides.length > 1;

  const goTo = React.useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || !isCarousel) return;

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
  }, [isCarousel]);

  React.useEffect(() => {
    if (!isCarousel) return;
    const interval = window.setInterval(() => {
      if (pausedRef.current) return;
      goTo((active + 1) % activeSlides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(interval);
  }, [active, goTo, activeSlides.length, isCarousel]);

  if (activeSlides.length === 0) {
    return null; // Don't render the slider if there are no active banners
  }

  // A single banner is just a static image/overlay — no drag-to-scroll
  // track, nav arrows or dots, so there is nothing that could ever show a
  // scrollbar or invite a swipe gesture that goes nowhere.
  if (!isCarousel) {
    return (
      <section className="relative w-full max-w-full overflow-hidden bg-plum-950 text-ivory-100">
        <HeroSlide slide={activeSlides[0]} index={0} />
      </section>
    );
  }

  return (
    <section className="relative w-full max-w-full overflow-hidden bg-plum-950 text-ivory-100">
      <div
        className="group relative w-full overflow-hidden"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
        onTouchEnd={() => {
          pausedRef.current = false;
        }}
      >
        <ul
          ref={trackRef}
          // overflow-y-hidden is load-bearing, not decorative: per the CSS
          // overflow spec, setting overflow-x to anything but `visible`
          // silently computes overflow-y to `auto` too if left unset — so
          // without this, any sub-pixel height mismatch between slides
          // (different uploaded images, one slide with a text overlay and
          // one without) shows up as a real vertical scrollbar on the track.
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        >
          {activeSlides.map((slide, i) => (
            <li key={i} data-index={i} className="w-full shrink-0 snap-center">
              <HeroSlide slide={slide} index={i} />
            </li>
          ))}
        </ul>

        {/* Carousel Navigation Buttons */}
        <button
          type="button"
          onClick={() =>
            goTo((active - 1 + activeSlides.length) % activeSlides.length)
          }
          aria-label="Previous slide"
          className="absolute top-1/2 left-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-plum-950/60 text-ivory-100 backdrop-blur-md transition-all duration-200 hover:bg-plum-950/80 sm:flex"
        >
          <ArrowLeft size={20} />
        </button>

        <button
          type="button"
          onClick={() => goTo((active + 1) % activeSlides.length)}
          aria-label="Next slide"
          className="absolute top-1/2 right-4 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-plum-950/60 text-ivory-100 backdrop-blur-md transition-all duration-200 hover:bg-plum-950/80 sm:flex"
        >
          <ArrowRight size={20} />
        </button>

        {/* Carousel Dots */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={active === i}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                active === i
                  ? "w-8 bg-gold-400"
                  : "w-2 bg-white/40 hover:bg-white/60",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
