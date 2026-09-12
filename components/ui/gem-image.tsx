import { cn } from "@/lib/utils";

/**
 * Placeholder artwork for products, categories and guides.
 *
 * Real photography goes through Cloudinary in Phase 16 (§29 Media Flow). Until
 * then this renders a faceted-gem illustration derived from the item's own
 * colour: a radial body colour, straight facet linework radiating from a
 * bright "table" (not a blurry conic-gradient smear), and one or two sparkle
 * glints — so listings read as cut stones rather than colour swatches.
 * Swap the internals for <Image> when media lands — call sites keep their props.
 */
export function GemImage({
  color,
  className,
  seed = 0,
  vignette = true,
  framed = false,
}: {
  color: string;
  className?: string;
  /** Rotates the facet pattern and glint positions so a gallery of one stone still varies. */
  seed?: number;
  vignette?: boolean;
  /** A thin gold bezel rim, like a jewel setting — for hero/feature contexts. */
  framed?: boolean;
}) {
  const rotate = (seed * 23) % 360;
  const lightX = 26 + ((seed * 13) % 30);
  const lightY = 14 + ((seed * 7) % 16);

  const facetCount = 10;
  const facets = Array.from({ length: facetCount }, (_, i) => {
    const angle = ((360 / facetCount) * i + rotate) * (Math.PI / 180);
    return {
      x2: 50 + Math.cos(angle) * 68,
      y2: 50 + Math.sin(angle) * 68,
      light: i % 2 === 0,
    };
  });

  const sparkles = [
    { x: 18 + ((seed * 17) % 20), y: 66 + ((seed * 11) % 18), size: 11, delay: "0s" },
    { x: 68 + ((seed * 19) % 18), y: 20 + ((seed * 9) % 18), size: 8, delay: ".9s" },
  ];

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-plum-950",
        framed && "ring-2 ring-inset ring-gold-400/80",
        className,
      )}
    >
      {/* Body colour, brightest where the light hits. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(125% 100% at ${lightX}% ${lightY}%, ${color} 0%, ${color} 20%, color-mix(in oklab, ${color} 62%, #1e0722) 56%, #170519 100%)`,
        }}
      />

      {/* Facet linework — straight edges from a bright table, not a blurred smear. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-80 mix-blend-overlay"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {facets.map((f, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={f.x2}
            y2={f.y2}
            stroke={f.light ? "white" : "black"}
            strokeOpacity={f.light ? 0.6 : 0.32}
            strokeWidth="0.7"
          />
        ))}
        <polygon
          points="50,41 58,50 50,59 42,50"
          fill="white"
          fillOpacity="0.55"
        />
      </svg>

      {/* Specular glint. */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(32% 26% at ${lightX + 6}% ${lightY + 8}%, rgba(255,255,255,.75) 0%, transparent 72%)`,
        }}
      />

      {sparkles.map((s, i) => (
        <svg
          key={i}
          className="animate-twinkle absolute motion-reduce:hidden"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"
            fill="white"
            fillOpacity="0.95"
          />
        </svg>
      ))}

      {vignette && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(75% 65% at 50% 45%, transparent 40%, rgba(30,7,34,.55) 100%)",
          }}
        />
      )}
    </div>
  );
}
