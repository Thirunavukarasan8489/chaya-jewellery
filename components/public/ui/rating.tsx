import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex items-center gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              value >= i + 0.75
                ? "fill-gold-400 text-gold-400"
                : value >= i + 0.25
                  ? "fill-gold-400/50 text-gold-400"
                  : "fill-transparent text-plum-300",
            )}
            strokeWidth={1.75}
          />
        ))}
      </span>
      {count !== undefined && (
        <span className="text-xs text-ink-muted tabular-nums">
          {value.toFixed(1)}{" "}
          <span className="text-plum-400">({count})</span>
        </span>
      )}
      <span className="sr-only">
        Rated {value} out of 5{count !== undefined && ` from ${count} reviews`}
      </span>
    </span>
  );
}
