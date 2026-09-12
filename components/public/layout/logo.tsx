import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Chaya Jewellery — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      {/* <span className="relative grid size-9 shrink-0 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rotate-45 rounded-[0.5rem] bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-gold transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-[135deg]"
        />
        </span>
      </span> */}
      <span className="relative grid shrink-0 place-items-center">
        <Image
          src="/logo.png"
          alt="Chaya Jewellery Logo"
          width={100}
          height={100}
          className="object-contain w-auto h-auto"
          priority
        />
      </span>

      {/* <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-base font-semibold tracking-tight sm:text-lg",
            onDark ? "text-ivory-100" : "text-plum-900",
          )}
        >
          Chaya Jewellery
        </span>
        <span
          className={cn(
            "mt-0.5 text-[0.5rem] font-semibold tracking-[0.2em] uppercase sm:text-[0.5625rem] sm:tracking-[0.22em]",
            onDark ? "text-gold-400" : "text-gold-700",
          )}
        >
          Certified Gemstones
        </span>
      </span> */}
    </Link>
  );
}
