"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, PackageCheck } from "lucide-react";
import { AddToCart } from "@/components/public/cart/add-to-cart";
import { EnquireModal } from "@/components/public/product/enquire-modal";
import { Badge } from "@/components/public/ui/badge";
import { buttonStyles } from "@/components/public/ui/button";
import { Rating } from "@/components/public/ui/rating";
import {
  canBuy,
  canEnquire,
  type Category,
  type Product,
  type ProductVariant,
} from "@/lib/types";
import { discountPercent, formatINR, cn, whatsappLink } from "@/lib/utils";

function cleanVariantName(
  rawName: string | undefined,
  caratApprox?: number | string,
  size?: string | number,
  idx: number = 0,
): string {
  let name = rawName || "";

  // 1. Remove 0 Carat / 0 ct variations
  name = name.replace(/\b0(?:\.0+)?\s*(?:carat|ct|carats)\b/gi, "");

  // 2. Remove 0 mm / 0mm / 0 size variations
  name = name.replace(/\b0(?:\.0+)?\s*(?:mm|cm)\b/gi, "");

  // 3. Remove standalone N/A
  name = name.replace(/\bN\/A\b/gi, "");

  // 4. Clean up leftover separators (e.g. " - ", leading/trailing hyphens/spaces)
  name = name
    .replace(/^\s*[-–—,:]+\s*/, "")
    .replace(/\s*[-–—,:]+\s*$/, "")
    .replace(/\s*[-–—,:]+\s*[-–—,:]+\s*/g, " - ")
    .trim();

  // If cleaning resulted in empty string, construct from valid fields
  if (!name) {
    const validCarat =
      caratApprox && Number(caratApprox) > 0 ? `${caratApprox} Carat` : null;
    const validSize =
      size &&
      size !== "0" &&
      size !== "0 mm" &&
      String(size).toLowerCase() !== "n/a" &&
      String(size).trim() !== "" &&
      Number(size) !== 0
        ? `${size}`
        : null;

    if (validCarat && validSize) {
      name = `${validCarat} - ${validSize}`;
    } else if (validCarat) {
      name = validCarat;
    } else if (validSize) {
      name = validSize;
    } else {
      name = `Option ${idx + 1}`;
    }
  }

  return name;
}

function getVariantSubtitle(
  variant: ProductVariant,
  cleanName: string,
): string | null {
  const numCarat = variant.caratApprox ? Number(variant.caratApprox) : 0;
  const hasCarat = !isNaN(numCarat) && numCarat > 0;

  const rawSize = variant.size ? String(variant.size).trim() : "";
  const numSize = Number(rawSize);
  const hasSize =
    rawSize !== "" &&
    rawSize !== "0" &&
    rawSize !== "0 mm" &&
    rawSize.toLowerCase() !== "n/a" &&
    (isNaN(numSize) || numSize > 0);

  if (!hasCarat && !hasSize) return null;

  const nameLower = cleanName.toLowerCase();
  const caratInName =
    hasCarat &&
    (nameLower.includes(`${numCarat}`) ||
      nameLower.includes("carat") ||
      nameLower.includes("ct"));
  const sizeInName = hasSize && nameLower.includes(rawSize.toLowerCase());

  if (hasCarat && hasSize && caratInName && sizeInName) return null;
  if (hasCarat && !hasSize && caratInName) return null;
  if (!hasCarat && hasSize && sizeInName) return null;

  const parts: string[] = [];
  if (hasCarat && !caratInName) {
    parts.push(`~${numCarat} ct`);
  }
  if (hasSize && !sizeInName) {
    parts.push(`(${rawSize})`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

export function ProductPurchaseOptions({
  product,
  category,
  business,
}: {
  product: Product;
  category?: Category;
  business?: any;
}) {
  const [selectedVariantIdx, setSelectedVariantIdx] = React.useState(0);

  const hasVariants =
    product.hasVariants && product.variants && product.variants.length > 0;
  const activeVariant = hasVariants
    ? product.variants![selectedVariantIdx]
    : null;

  const activeCleanName = activeVariant
    ? cleanVariantName(
        activeVariant.name,
        activeVariant.caratApprox,
        activeVariant.size,
        selectedVariantIdx,
      )
    : undefined;

  // Active pricing based on variant or fallback
  const sellingPrice = activeVariant
    ? activeVariant.price
    : product.sellingPrice;
  const comparePrice = activeVariant
    ? activeVariant.comparePrice
    : product.comparePrice;
  const off = discountPercent(sellingPrice, comparePrice);

  // Active stock based on variant or fallback (stock minus what's already reserved by pending orders)
  const available = activeVariant
    ? Math.max(0, activeVariant.stock - (activeVariant.reservedQuantity || 0))
    : Math.max(0, product.stockQuantity - product.reservedQuantity);

  const threshold = activeVariant
    ? activeVariant.lowStockThreshold
    : product.lowStockThreshold;

  let status = "IN_STOCK";
  if (available <= 0) status = "OUT_OF_STOCK";
  else if (available <= threshold) status = "LOW_STOCK";

  const buyable = canBuy(product);
  const enquirable = canEnquire(product);

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Rating value={product.rating} count={product.reviewCount} />
        {status === "IN_STOCK" && (
          <Badge tone="emerald">
            <PackageCheck size={12} /> In stock
          </Badge>
        )}
        {status === "LOW_STOCK" && (
          <Badge tone="warning">Only {available} left</Badge>
        )}
        {status === "OUT_OF_STOCK" && <Badge tone="plum">Sold out</Badge>}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold text-plum-900 tabular-nums sm:text-4xl">
          {formatINR(sellingPrice)}
        </span>
        {comparePrice && comparePrice > sellingPrice && (
          <span className="text-lg text-plum-400 line-through tabular-nums">
            {formatINR(comparePrice)}
          </span>
        )}
        {off && <Badge tone="gold">Save {off}%</Badge>}
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Inclusive of all taxes. Shipping calculated at checkout.
      </p>

      {product.shortDescription && (
        <div
          className="rich-text mt-5 text-[0.9375rem] leading-relaxed text-plum-800"
          dangerouslySetInnerHTML={{ __html: product.shortDescription }}
        />
      )}

      {/* Variant Selector */}
      {hasVariants && (
        <div className="mt-7">
          <h3 className="text-sm font-medium text-plum-900 mb-3">Options</h3>
          <div className="flex flex-wrap gap-2">
            {product.variants!.map((variant, idx) => {
              const isActive = idx === selectedVariantIdx;
              const isSoldOut =
                variant.stock - (variant.reservedQuantity || 0) <= 0;
              const cleanName = cleanVariantName(
                variant.name,
                variant.caratApprox,
                variant.size,
                idx,
              );
              const subtitle = getVariantSubtitle(variant, cleanName);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200",
                    isActive
                      ? "border-gold-500 bg-gold-50/50 shadow-sm ring-1 ring-gold-500"
                      : "border-plum-200 bg-white hover:border-gold-300 hover:bg-gold-50/30",
                    isSoldOut && !isActive && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "text-[0.8125rem] font-semibold leading-tight",
                      isActive ? "text-gold-900" : "text-plum-900",
                    )}
                  >
                    {cleanName}
                  </span>
                  {subtitle && (
                    <span className="mt-1 text-xs text-plum-500">
                      {subtitle}
                    </span>
                  )}
                  {isSoldOut && (
                    <span className="mt-1 text-[0.6875rem] font-medium text-plum-400 uppercase tracking-wide">
                      Sold Out
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase CTA */}
      <div className="mt-7 space-y-3" id="enquire">
        {buyable && (
          <AddToCart
            product={product}
            variantId={activeVariant?.id}
            variantSku={activeVariant?.sku}
            variantName={activeCleanName}
            variantPrice={activeVariant?.price}
            maxQuantity={activeVariant ? available : undefined}
            variantValue={activeVariant?.variantValue}
            calculatePriceOnVariantValue={
              category?.calculatePriceOnVariantValue
            }
          />
        )}

        {enquirable && (
          <div className="grid gap-3 sm:grid-cols-2">
            <EnquireModal
              productId={product.id}
              categoryId={category?.id}
              productName={product.name}
              categoryName={category?.name}
              variantName={activeCleanName}
              buyable={buyable}
            />
            {product.whatsappEnabled && (
              <a
                href={whatsappLink(
                  business,
                  `Hi Chaya Jewellery, I am interested in ${product.name} (${product.sku})${activeCleanName ? ` - ${activeCleanName}` : ""}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({
                  variant: "whatsapp",
                  size: "lg",
                  full: true,
                })}
              >
                WhatsApp us
              </a>
            )}
          </div>
        )}

        {!buyable && (
          <p className="rounded-xl bg-ivory-200 px-4 py-3 text-[0.8125rem] leading-relaxed text-plum-800">
            This is a one-of-a-kind piece sold by enquiry. We will walk you
            through origin, treatment and pricing, and arrange independent
            verification before any payment.
          </p>
        )}
      </div>
    </>
  );
}
