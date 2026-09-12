"use client";

import * as React from "react";
import { Quote } from "lucide-react";
import { Rating } from "@/components/public/ui/rating";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { cn } from "@/lib/utils";

export function Testimonials({ items }: { items?: any[] }) {
  const testimonials = items || [];
  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLUListElement>(null);

  const scrollToSlide = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const scrollLeft = track.scrollLeft;
    const itemWidth = track.firstElementChild ? (track.firstElementChild as HTMLElement).offsetWidth + 12 : 260;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== active && newIndex >= 0 && newIndex < testimonials.length) {
      setActive(newIndex);
    }
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="relative w-full max-w-full overflow-hidden bg-ivory-200 py-12 sm:py-16 lg:py-20">
      <div className="shell gutter">
        <SectionHeading
          eyebrow="Testimonials"
          title="What buyers say"
          body="Unedited, authentic reviews from verified gemstone buyers."
          href="/testimonials"
        />
      </div>

      <div className="relative w-full max-w-full overflow-hidden px-3">
        {/* Swipe Rail */}
        <ul
          ref={trackRef}
          onScroll={handleScroll}
          className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:gap-4 sm:px-6 lg:mx-auto lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-8"
        >
          {testimonials.map((t: any, i: number) => (
            <li
              key={t._id || i}
              data-index={i}
              className="w-[84%] min-w-[15.5rem] shrink-0 snap-start lg:w-auto lg:min-w-0"
            >
              <figure className="flex h-full flex-col rounded-2xl border border-ivory-300 bg-white p-5 shadow-xs transition-shadow duration-300 hover:shadow-md">
                <Quote
                  size={22}
                  className="mb-3 shrink-0 fill-gold-200 text-gold-400"
                />
                <blockquote className="flex-1 text-[0.9375rem] leading-relaxed text-plum-900 font-normal">
                  &quot;{t.quote}&quot;
                </blockquote>
                <figcaption className="mt-5 border-t border-ivory-200 pt-4">
                  <Rating value={t.rating} className="mb-2" />
                  <p className="text-sm font-semibold text-plum-950">{t.customerName}</p>
                  <p className="mt-0.5 text-xs text-plum-600 font-medium">
                    {t.location}{t.productReference?.name ? ` · purchased ${t.productReference.name}` : ''}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        {/* Bottom Slider Dots Pagination (Mobile & Tablet) */}
        {testimonials.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 lg:hidden">
            {testimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToSlide(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={active === index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  active === index
                    ? "w-6 bg-gold-500"
                    : "w-2 bg-ivory-300 hover:bg-gold-300"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
