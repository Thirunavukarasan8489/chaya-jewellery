"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Info,
  ListFilter,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { sanitizeRichText } from "@/lib/sanitize";

interface ProductAccordionProps {
  product: Product;
  defaultOpenSection?: "about" | "specs" | "shipping" | "all";
}

interface SpecItem {
  label: string;
  value: string;
}

export function ProductAccordion({
  product,
  defaultOpenSection = "about",
}: ProductAccordionProps) {
  // Allow toggling each section independently
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    about: defaultOpenSection === "about" || defaultOpenSection === "all",
    specs: defaultOpenSection === "specs" || defaultOpenSection === "all",
    shipping: defaultOpenSection === "shipping" || defaultOpenSection === "all",
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Compile valid specifications
  const specs: SpecItem[] = [];
  const s = product.specifications;

  if (product.sku) {
    specs.push({ label: "Product Code (SKU)", value: product.sku });
  }
  if (s?.material) {
    specs.push({ label: "Base Metal", value: s.material });
  }
  if (s?.purity) {
    specs.push({
      label: "Metal Purity",
      value:
        s.purity.toLowerCase().includes("hallmark") ||
        s.purity.toLowerCase().includes("k")
          ? s.purity
          : `${s.purity} Fineness`,
    });
  }
  if (s?.colour) {
    specs.push({ label: "Metal Colour", value: s.colour });
  }
  if (s?.style) {
    specs.push({ label: "Design Style", value: s.style });
  }
  if (s?.occasion) {
    specs.push({ label: "Ideal Occasion", value: s.occasion });
  }
  if (s?.stoneType) {
    specs.push({ label: "Stone Type", value: s.stoneType });
  }
  if (s?.stoneColour) {
    specs.push({ label: "Stone Colour", value: s.stoneColour });
  }
  if (s?.collectionName) {
    specs.push({ label: "Collection", value: s.collectionName });
  }
  if (typeof product.grossWeight === "number" && product.grossWeight > 0) {
    specs.push({ label: "Gross Weight", value: `${product.grossWeight} g` });
  }
  if (typeof product.netWeight === "number" && product.netWeight > 0) {
    specs.push({ label: "Net Weight", value: `${product.netWeight} g` });
  }
  if (typeof product.stoneWeight === "number" && product.stoneWeight > 0) {
    specs.push({ label: "Stone Weight", value: `${product.stoneWeight} g` });
  }

  const hasDescription = Boolean(
    product.description && product.description.trim(),
  );
  const hasSpecs = specs.length > 0;

  return (
    <div className="mt-8 divide-y divide-ivory-300 border-y border-ivory-300">
      {/* 1. About this piece */}
      {hasDescription && (
        <div className="py-4 sm:py-5">
          <button
            type="button"
            onClick={() => toggleSection("about")}
            aria-expanded={openSections.about}
            className="group flex w-full cursor-pointer items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
                <Info size={15} />
              </span>
              <h2 className="font-display text-base font-semibold text-plum-900 group-hover:text-gold-700 sm:text-lg transition-colors">
                About this piece
              </h2>
            </div>
            <span
              className={`grid size-7 place-items-center rounded-full bg-ivory-100 text-plum-700 transition-transform duration-300 ${
                openSections.about ? "rotate-180 bg-plum-900 text-white" : ""
              }`}
            >
              <ChevronDown size={16} />
            </span>
          </button>

          {openSections.about && (
            <div className="pt-4 pb-2 animate-in fade-in-50 duration-200">
              <div
                className="rich-text text-[0.9375rem] leading-relaxed text-plum-800 max-w-none"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(product.description),
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* 2. Product Specifications */}
      {hasSpecs && (
        <div className="py-4 sm:py-5">
          <button
            type="button"
            onClick={() => toggleSection("specs")}
            aria-expanded={openSections.specs}
            className="group flex w-full cursor-pointer items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
                <ListFilter size={15} />
              </span>
              <h2 className="font-display text-base font-semibold text-plum-900 group-hover:text-gold-700 sm:text-lg transition-colors">
                Product Specifications
              </h2>
            </div>
            <span
              className={`grid size-7 place-items-center rounded-full bg-ivory-100 text-plum-700 transition-transform duration-300 ${
                openSections.specs ? "rotate-180 bg-plum-900 text-white" : ""
              }`}
            >
              <ChevronDown size={16} />
            </span>
          </button>

          {openSections.specs && (
            <div className="pt-4 pb-2 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {specs.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-ivory-300/80 bg-ivory-100/50 px-3.5 py-2.5 text-xs sm:text-sm"
                  >
                    <span className="font-medium text-plum-600/90">
                      {item.label}
                    </span>
                    <span className="font-semibold text-plum-950 text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Shipping & Delivery */}
      <div className="py-4 sm:py-5">
        <button
          type="button"
          onClick={() => toggleSection("shipping")}
          aria-expanded={openSections.shipping}
          className="group flex w-full cursor-pointer items-center justify-between text-left transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-500/20">
              <Truck size={15} />
            </span>
            <h2 className="font-display text-base font-semibold text-plum-900 group-hover:text-gold-700 sm:text-lg transition-colors">
              Shipping &amp; Authenticity
            </h2>
          </div>
          <span
            className={`grid size-7 place-items-center rounded-full bg-ivory-100 text-plum-700 transition-transform duration-300 ${
              openSections.shipping
                ? "rotate-180 bg-plum-900 text-white"
                : ""
            }`}
          >
            <ChevronDown size={16} />
          </span>
        </button>

        {openSections.shipping && (
          <div className="pt-4 pb-2 space-y-3 animate-in fade-in-50 duration-200">
            <ul className="space-y-2.5 text-[0.875rem] sm:text-[0.9375rem] leading-relaxed text-plum-800">
              <li className="flex items-start gap-2.5">
                <CheckCircle2
                  size={16}
                  className="mt-1 text-gold-600 shrink-0"
                />
                <span>
                  <strong>Insured Express Delivery:</strong> Dispatched within 2
                  working days, fully insured with secure signature verification
                  on handover.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <RotateCcw size={16} className="mt-1 text-gold-600 shrink-0" />
                <span>
                  <strong>7-Day Returns:</strong> Eligible unworn jewellery can
                  be returned within 7 days in original tamper-evident packaging
                  with warranty tags intact.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck
                  size={16}
                  className="mt-1 text-gold-600 shrink-0"
                />
                <span>
                  <strong>Certificate of Authenticity:</strong> Every shipment
                  includes a certificate documenting hallmark purity, metal
                  weight, and stone disclosure.
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
