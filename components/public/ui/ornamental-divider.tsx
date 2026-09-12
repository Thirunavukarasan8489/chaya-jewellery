import { cn } from "@/lib/utils";

/** A small kalash-lozenge rule — the catalogue-page flourish, used sparingly. */
export function OrnamentalDivider({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <span
        className={cn(
          "h-px w-10 sm:w-16",
          onDark
            ? "bg-gradient-to-r from-transparent to-gold-400/70"
            : "bg-gradient-to-r from-transparent to-gold-500/60",
        )}
      />
      <span className="size-1.5 rotate-45 bg-gold-500" />
      <span
        className={cn(
          "h-px w-10 sm:w-16",
          onDark
            ? "bg-gradient-to-l from-transparent to-gold-400/70"
            : "bg-gradient-to-l from-transparent to-gold-500/60",
        )}
      />
    </div>
  );
}
