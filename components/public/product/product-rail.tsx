"use client";

import * as React from "react";
import { ProductCard } from "@/components/public/product/product-card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Responsive Product Rail featuring client-side scroll tracking,
 * swipe gestures on mobile, clean grid fallback on desktop, and interactive bottom slider dots.
 */
export function ProductRail({
  products,
  className,
  priority = false,
}: {
  products: Product[];
  className?: string;
  /** Set only for a rail that renders above the fold (e.g. right after the hero) — not for below-the-fold rails like "related products". */
  priority?: boolean;
}) {
  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef<HTMLUListElement>(null);

  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, 8);

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
    const itemWidth = track.firstElementChild ? (track.firstElementChild as HTMLElement).offsetWidth + 12 : 200;
    const newIndex = Math.round(scrollLeft / itemWidth);
    if (newIndex !== active && newIndex >= 0 && newIndex < displayProducts.length) {
      setActive(newIndex);
    }
  };

  return (
    <div className={cn("relative w-full max-w-full overflow-hidden", className)}>
      {/* Mobile Swipeable Product Rail (Phone & Tablet) */}
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pt-1 pb-3 lg:hidden"
      >
        {displayProducts.map((product, i) => (
          <li
            key={product.slug}
            data-index={i}
            className="w-[46%] min-w-[10.5rem] shrink-0 snap-start"
          >
            <ProductCard product={product} className="h-full" priority={priority && i < 2} />
          </li>
        ))}
      </ul>

      {/* Desktop Grid Layout */}
      <ul className="hidden gap-5 lg:grid lg:grid-cols-4">
        {displayProducts.map((product, i) => (
          <li key={product.slug}>
            <ProductCard product={product} className="h-full" priority={priority && i < 4} />
          </li>
        ))}
      </ul>

      {/* Bottom Slider Dots Pagination (Mobile & Tablet) */}
      {displayProducts.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 lg:hidden">
          {displayProducts.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToSlide(index)}
              aria-label={`Go to product ${index + 1}`}
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
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {products.map((product, i) => (
        <li key={product.slug}>
          <ProductCard product={product} className="h-full" priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
