import Link from "next/link";
import { buttonStyles } from "@/components/public/ui/button";
import { OrnamentalBg } from "@/components/public/ui/ornamental-bg";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 items-center overflow-hidden bg-plum-950 text-ivory-100">
      <OrnamentalBg glowPosition="50% 30%" />

      <div className="shell gutter relative py-24 text-center">
        <p className="font-display text-6xl font-semibold sm:text-8xl">
          <span className="text-foil">404</span>
        </p>
        <h1 className="mt-5 text-[1.75rem] leading-tight font-semibold sm:text-4xl">
          This page is not in the vault
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-plum-200">
          The link may be out of date, or the stone may already have found an
          owner. Try the catalogue instead.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/products" className={buttonStyles({ size: "lg" })}>
            Browse gemstones
          </Link>
          <Link
            href="/"
            className={buttonStyles({
              variant: "outline",
              size: "lg",
              className:
                "border-ivory-100/25 bg-white/8 text-ivory-100 hover:border-ivory-100/50 hover:bg-white/14",
            })}
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
