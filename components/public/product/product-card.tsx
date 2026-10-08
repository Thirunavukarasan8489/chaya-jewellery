import Link from "next/link";
import { CldImage } from "@/components/shared/CldImage";
import { MessageSquareText, ArrowUpRight } from "lucide-react";
import { QuickAdd } from "@/components/public/cart/add-to-cart";
import { GemImage } from "@/components/public/ui/gem-image";
import { canBuy, stockStatus, type Product } from "@/lib/types";
import { categoryTerms, cn, discountPercent, formatINR, isComboProduct } from "@/lib/utils";

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

  const primaryUrl = product.primaryImage?.url;
  const secondaryImage =
    product.images && product.images.length > 0
      ? product.images.find((img) => img?.url && img.url !== primaryUrl)
      : undefined;

  const categoryName = category
    ? categoryTerms(category.name).primary
    : product.categorySlug.replace(/-/g, " ");

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-ivory-300/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/60 hover:shadow-xl hover:shadow-plum-950/8",
        className,
      )}
    >
      {/* Product Media Viewport with Dual-Angle Crossfade & Badges */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-ivory-100/70">
        {product.primaryImage ? (
          <>
            <CldImage
              src={product.primaryImage.url}
              alt={product.primaryImage.altText || product.name}
              width={400}
              height={500}
              priority={priority}
              loading={priority ? undefined : "lazy"}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Alternate Angle Crossfade on Hover (when available) */}
            {secondaryImage?.url && (
              <CldImage
                src={secondaryImage.url}
                alt={secondaryImage.altText || `${product.name} view 2`}
                width={400}
                height={500}
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
              />
            )}
          </>
        ) : (
          <GemImage
            color={product.gemColor}
            seed={product.id.length}
            className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}

        {/* Floating Luxury Badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1.5">
          {isComboProduct(product) && (
            <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-plum-950 shadow-xs">
              Combo Set
            </span>
          )}

          {status === "OUT_OF_STOCK" ? (
            <span className="rounded-full bg-plum-950/85 px-2.5 py-0.5 text-[10px] font-bold text-ivory-200 backdrop-blur-md shadow-xs">
              Sold out
            </span>
          ) : off ? (
            <span className="rounded-full bg-plum-900/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-gold-300 border border-gold-400/30 backdrop-blur-md shadow-xs">
              {off}% OFF
            </span>
          ) : product.bestseller && !isComboProduct(product) ? (
            <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-plum-950 shadow-xs">
              Bestseller
            </span>
          ) : null}

          {!buyable && (
            <span className="rounded-full bg-emerald-800/90 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-100 backdrop-blur-md shadow-xs">
              By enquiry
            </span>
          )}

          {status === "LOW_STOCK" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-300 shadow-2xs">
              Few left
            </span>
          )}
        </div>

        {/* Material / Purity Pill (Top Right) */}
        {/* {product.specifications?.purity && (
          <div className="pointer-events-none absolute right-2.5 top-2.5 z-10">
            <span className="rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-plum-900 border border-ivory-300/80 shadow-2xs">
              {product.specifications.purity}
            </span>
          </div>
        )} */}

        {/* Floating "View Details" Hover Pill */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-center justify-center opacity-0 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-plum-950 shadow-lg border border-ivory-300/80 tracking-wide transition-colors group-hover:bg-plum-900 group-hover:text-gold-300 group-hover:border-gold-500/50">
            <span>View Details</span>
            <ArrowUpRight
              size={13}
              className="text-gold-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>
      </div>

      {/* Card Content & Pricing */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Category & Subcategory Eyebrow */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-gold-700">
          <span className="truncate">{categoryName}</span>
          {product.subCategoryName && (
            <>
              <span className="size-1 rounded-full bg-gold-400 shrink-0" />
              <span className="truncate text-plum-500 font-medium">
                {product.subCategoryName}
              </span>
            </>
          )}
        </div>

        {/* Product Title (Turns Gold on Card Hover) */}
        <h3 className="mt-1 line-clamp-2 font-serif text-sm font-semibold text-plum-950 transition-colors duration-200 group-hover:text-gold-700 sm:text-[0.9375rem] leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h3>

        {/* Micro Specification / Craftsmanship Note */}
        {product.specifications?.stoneType ? (
          <p className="mt-1 text-[11px] text-plum-600/80 line-clamp-1">
            {product.specifications.stoneType}
            {product.specifications.style
              ? ` • ${product.specifications.style}`
              : ""}
          </p>
        ) : product.specifications?.material ? (
          <p className="mt-1 text-[11px] text-plum-600/80 line-clamp-1">
            {product.specifications.material}
            {product.specifications.colour
              ? ` (${product.specifications.colour})`
              : ""}
          </p>
        ) : (
          <div className="h-3" />
        )}

        {/* Footer: Price & Quick Action */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-ivory-200/80">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-bold text-plum-950 tabular-nums sm:text-lg">
                {formatINR(product.sellingPrice)}
              </span>
              {Boolean(
                product.comparePrice &&
                product.comparePrice > product.sellingPrice,
              ) && (
                <span className="text-xs text-plum-400 line-through tabular-nums">
                  {formatINR(product.comparePrice!)}
                </span>
              )}
            </div>
            {off ? (
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                Save {off}%
              </span>
            ) : null}
          </div>

          {buyable ? (
            <div className="relative z-10">
              <QuickAdd product={product} />
            </div>
          ) : (
            <Link
              href={`/products/${product.slug}#enquire`}
              aria-label={`Enquire about ${product.name}`}
              className="relative z-10 grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:scale-105 active:scale-95"
            >
              <MessageSquareText size={16} strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
