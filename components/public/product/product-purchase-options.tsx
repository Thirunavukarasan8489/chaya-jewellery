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
} from "@/lib/types";
import { discountPercent, formatINR, cn, whatsappLink } from "@/lib/utils";

export function ProductPurchaseOptions({
  product,
  category,
  business,
}: {
  product: Product;
  category?: Category;
  business?: any;
}) {
  const sellingPrice = product.sellingPrice;
  const comparePrice = product.comparePrice;
  const off = discountPercent(sellingPrice, comparePrice);

  const available = Math.max(0, product.stockQuantity - product.reservedQuantity);
  const threshold = product.lowStockThreshold;

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



      {/* Purchase CTA */}
      <div className="mt-7 space-y-3" id="enquire">
        {buyable && (
          <AddToCart
            product={product}
            maxQuantity={available}
          />
        )}

        {enquirable && (
          <div className="grid gap-3 sm:grid-cols-2">
            <EnquireModal
              productId={product.id}
              categoryId={category?.id}
              productName={product.name}
              categoryName={category?.name}
              buyable={buyable}
            />
            {product.whatsappEnabled && (
              <a
                href={whatsappLink(
                  business,
                  `Hi Chaya Jewellery, I am interested in ${product.name} (${product.sku}).`,
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
