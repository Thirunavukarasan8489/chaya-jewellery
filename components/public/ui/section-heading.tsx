import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  body,
  href,
  hrefLabel = "View all",
  align = "start",
  onDark = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  href?: string;
  hrefLabel?: string;
  align?: "start" | "center";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full flex-wrap items-end gap-x-6 gap-y-3",
          align === "center" ? "justify-center" : "justify-between",
        )}
      >
        <div className={cn("min-w-0", align === "center" && "text-center")}>
          {eyebrow && (
            <p
              className={cn(
                "mb-2 text-[0.6875rem] font-semibold tracking-[0.18em] uppercase",
                onDark ? "text-foil" : "text-gold-700",
              )}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className={cn(
              "text-[1.75rem] leading-[1.15] font-semibold sm:text-4xl",
              onDark ? "text-ivory-100" : "text-plum-900",
            )}
          >
            {title}
          </h2>
        </div>

        {href && (
          <Link
            href={href}
            className={cn(
              "group hidden shrink-0 items-center gap-1.5 text-sm font-semibold sm:inline-flex",
              onDark
                ? "text-gold-300 hover:text-gold-200"
                : "text-plum-700 hover:text-gold-700",
            )}
          >
            {hrefLabel}
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {body && (
        <p
          className={cn(
            "max-w-2xl text-[0.9375rem] leading-relaxed",
            onDark ? "text-plum-200" : "text-ink-muted",
            align === "center" && "mx-auto",
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
