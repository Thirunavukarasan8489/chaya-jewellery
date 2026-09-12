import Link from "next/link";
import Image from "next/image";
import { MessageSquareText } from "lucide-react";
import { QuickAdd } from "@/components/public/cart/add-to-cart";
import { Badge } from "@/components/public/ui/badge";
import { GemImage } from "@/components/public/ui/gem-image";
import { Rating } from "@/components/public/ui/rating";

import { canBuy, stockStatus, type Product } from "@/lib/types";
import { categoryTerms, cn, discountPercent, formatINR } from "@/lib/utils";

export function ProductCard({
  product,
  category,
  className,
  priority = false,
}: {
  product: Product;
  category?: any;
  className?: string;
  /** Set for the first cards in an above-the-fold grid/rail so Next.js eager-loads the LCP image instead of lazy-loading it. */
  priority?: boolean;
}) {
  const off = discountPercent(product.sellingPrice, product.comparePrice);
  const status = stockStatus(product);
  const buyable = canBuy(product);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ivory-300 bg-white transition-[box-shadow,border-color] duration-300 hover:border-gold-300 hover:shadow-md",
        className,
      )}
    >
      <div className="relative">
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText || product.name}
            width={400}
            height={500}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className="aspect-4/5 w-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
          />
        ) : (
          <GemImage
            color={product.gemColor}
            seed={product.id.length}
            className="aspect-4/5 w-full transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
          />
        )}

        <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap gap-1.5">
          {status === "OUT_OF_STOCK" ? (
            <Badge tone="plum">Sold out</Badge>
          ) : off ? (
            <Badge tone="gold">{off}% off</Badge>
          ) : null}
          {!buyable && <Badge tone="emerald">By enquiry</Badge>}
          {status === "LOW_STOCK" && <Badge tone="warning">Last few</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {category && (
          <p className="mb-1 truncate text-[0.625rem] font-semibold tracking-[0.12em] text-gold-700 uppercase">
            {categoryTerms(category.name).primary}
          </p>
        )}

        <h3 className="line-2 text-[0.875rem] leading-snug font-semibold text-plum-900 sm:text-[0.9375rem]">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>

        <Rating
          value={product.rating}
          count={product.reviewCount}
          className="mt-1.5"
        />

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-plum-900 tabular-nums sm:text-lg">
              {formatINR(product.sellingPrice)}
            </p>
            {Boolean(product.comparePrice && product.comparePrice > product.sellingPrice) && (
              <p className="text-xs text-plum-400 line-through tabular-nums">
                {formatINR(product.comparePrice!)}
              </p>
            )}
          </div>

          {buyable ? (
            <div className="relative z-10">
              <QuickAdd product={product} />
            </div>
          ) : (
            <Link
              href={`/products/${product.slug}#enquire`}
              aria-label={`Enquire about ${product.name}`}
              className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-emerald-700 text-white shadow-md transition-[background-color,transform] duration-200 hover:bg-emerald-600 active:scale-95"
            >
              <MessageSquareText size={17} strokeWidth={2.25} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
