"use client";

import * as React from "react";

/**
 * Fades + rises content into view the first time it scrolls into the
 * viewport. Renders fully visible by default (no FOUC, nothing stuck
 * invisible if JS fails, no hydration mismatch) and only opts into the
 * hidden-then-reveal animation via direct DOM class toggling — not React
 * state — once mounted with IntersectionObserver support and no
 * `prefers-reduced-motion` preference.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** ms — stagger siblings in a grid/list by passing an incrementing value. */
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    node.style.transitionDelay = `${delay}ms`;
    node.classList.add(
      "transition-[opacity,transform]",
      "duration-700",
      "ease-[var(--ease-out-soft)]",
      "opacity-0",
      "translate-y-4",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.remove("opacity-0", "translate-y-4");
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
