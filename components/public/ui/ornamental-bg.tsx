import { cn } from "@/lib/utils";

/**
 * Shared background for every dark section: a fine gold jaali (lattice)
 * trellis — the diamond-screen pattern seen on jharokhas and temple
 * stonework — plus a warm glow. One consistent, Indian-architectural motif
 * used everywhere reads as a deliberate brand system; the blurry two-blob
 * radial gradient this replaced is the single most common "AI landing page"
 * background and appeared identically on every dark section of this site.
 */
export function OrnamentalBg({
  glowPosition = "50% 0%",
  className,
}: {
  glowPosition?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(221,182,58,.08) 0 1px, transparent 1px 30px)," +
            "repeating-linear-gradient(-45deg, rgba(221,182,58,.08) 0 1px, transparent 1px 30px)",
          maskImage:
            "radial-gradient(85% 85% at 50% 30%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(85% 85% at 50% 30%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 55% at ${glowPosition}, rgba(221,182,58,.22), transparent 70%)`,
        }}
      />
    </div>
  );
}
