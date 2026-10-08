"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CldImage } from "@/components/shared/CldImage";
import { GemImage } from "@/components/public/ui/gem-image";
import { cn } from "@/lib/utils";

/**
 * Swipe on mobile, thumbnails and left/right arrows on desktop.
 * Native scroll-snap does the paging so the gesture stays at 60fps;
 * an IntersectionObserver keeps active slide state and thumbnails in sync.
 */
export function ProductGallery({
  color,
  count,
  images,
  name,
}: {
  color: string;
  count?: number;
  images?: { url: string; altText?: string }[];
  name: string;
}) {
  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLUListElement>(null);

  const hasImages = images && images.length > 0;
  const numSlides = hasImages ? images.length : Math.max(1, count || 1);
  const slides = Array.from({ length: numSlides }, (_, i) => i);

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

  const goTo = (index: number) => {
    setActive(index);
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;

    // Scroll the track itself, not scrollIntoView
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  const prev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const prevIndex = active > 0 ? active - 1 : slides.length - 1;
    goTo(prevIndex);
  };

  const next = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const nextIndex = active < slides.length - 1 ? active + 1 : 0;
    goTo(nextIndex);
  };

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {/* Main Slide Viewport with Left/Right Navigation Arrows */}
      <div className="relative group/gallery overflow-hidden sm:rounded-2xl">
        <ul
          ref={trackRef}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden sm:mx-0 sm:rounded-2xl"
        >
        {slides.map((i) => (
          <li
            key={i}
            data-index={i}
            className="w-full shrink-0 snap-center px-4 sm:px-0"
          >
            {hasImages ? (
              // PERFORMANCE: was a raw <img> shipping full-resolution
              // Cloudinary originals on the highest-intent page in the
              // storefront — CldImage gets Cloudinary's f_auto/q_auto
              // delivery transforms, matching product-card.tsx's thumbnails.
              <CldImage
                src={images[i].url}
                alt={
                  images[i].altText ||
                  `${name} — view ${i + 1} of ${slides.length}`
                }
                width={800}
                height={800}
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="aspect-square w-full sm:rounded-2xl object-cover"
              />
            ) : (
              <GemImage
                color={color}
                seed={i * 7 + 3}
                className="aspect-square w-full sm:rounded-2xl"
              />
            )}
            <span className="sr-only">
              {name} — view {i + 1} of {slides.length}
            </span>
          </li>
        ))}
      </ul>

      {/* Prev & Next Navigation Arrows (Desktop & Mobile) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-11 items-center justify-center rounded-full bg-white/95 text-plum-900 border border-ivory-300 shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-plum-900 hover:text-gold-300 hover:border-gold-500/50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-400 cursor-pointer sm:opacity-90 sm:hover:opacity-100"
          >
            <ChevronLeft size={22} className="shrink-0 -translate-x-0.5" />
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-11 items-center justify-center rounded-full bg-white/95 text-plum-900 border border-ivory-300 shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-plum-900 hover:text-gold-300 hover:border-gold-500/50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold-400 cursor-pointer sm:opacity-90 sm:hover:opacity-100"
          >
            <ChevronRight size={22} className="shrink-0 translate-x-0.5" />
          </button>

          {/* Luxury Slide Index Pill */}
          <div className="absolute bottom-3 right-3 z-20 hidden sm:inline-flex items-center gap-1 rounded-full bg-plum-950/75 px-2.5 py-1 text-xs font-semibold text-ivory-100 backdrop-blur-md border border-white/15 shadow-sm">
            <span>{active + 1}</span>
            <span className="text-gold-400/80">/</span>
            <span>{slides.length}</span>
          </div>
        </>
      )}
    </div>

      {slides.length > 1 && (
        <>
          {/* Mobile Dot Indicators */}
          <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
            {slides.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={active === i}
                className={cn(
                  "h-1.5 rounded-none transition-all duration-300",
                  active === i ? "w-6 bg-gold-500" : "w-1.5 bg-plum-300",
                )}
              />
            ))}
          </div>

          {/* Desktop Thumbnail Selector */}
          <ul
            className={cn(
              "mt-3 hidden gap-2.5 sm:flex sm:overflow-x-auto sm:pb-1 no-scrollbar",
              slides.length <= 5 && "sm:grid sm:grid-cols-5",
            )}
          >
            {slides.map((i) => (
              <li key={i} className={cn(slides.length > 5 && "shrink-0 w-20")}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "block w-full overflow-hidden rounded-xl ring-2 transition-all duration-200 cursor-pointer",
                    active === i
                      ? "ring-gold-500 scale-[1.02] shadow-sm"
                      : "ring-transparent hover:ring-plum-300 opacity-70 hover:opacity-100",
                  )}
                >
                  {hasImages ? (
                    <CldImage
                      src={images[i].url}
                      alt={images[i].altText || `Thumbnail ${i + 1}`}
                      width={120}
                      height={120}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <GemImage
                      color={color}
                      seed={i * 7 + 3}
                      className="aspect-square w-full"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
