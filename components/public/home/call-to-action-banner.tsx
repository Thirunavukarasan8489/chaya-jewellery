import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/public/ui/reveal";

export async function CallToActionBanner() {
  return (
    <section className="shell gutter py-4">
      <div className="grid gap-1">
        <Reveal>
          <Link
            href="/products"
            className="group relative flex min-h-72 flex-col justify-end overflow-hidden bg-plum-950 p-7 text-ivory-100 sm:p-10"
          >
            <Image
              src="/images/call-to-action.png"
              alt="Call to Action Banner Image"
              fill
              sizes="(min-width: 1024px) 100vw, 100vw"
              className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-105"
            />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
