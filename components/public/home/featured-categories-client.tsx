"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CldImage } from "@/components/shared/CldImage";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { GemImage } from "@/components/public/ui/gem-image";
import { gemColorFor } from "@/lib/utils";
import type { FeaturedCategoryItem, FeaturedSubCategory } from "@/lib/services/category-service";

interface FeaturedCategoriesClientProps {
  categories: FeaturedCategoryItem[];
}

export function FeaturedCategoriesClient({ categories }: FeaturedCategoriesClientProps) {
  // Collect all subcategories across categories for the "All" tab view
  const allSubCategories: FeaturedSubCategory[] = categories.flatMap(
    (cat) => cat.subCategories
  );

  const [activeTab, setActiveTab] = useState<string>("all");

  const activeCategory =
    activeTab !== "all"
      ? categories.find((cat) => cat.slug === activeTab)
      : null;

  // Items to show based on active tab
  const displayedSubCategories: FeaturedSubCategory[] =
    activeTab === "all"
      ? allSubCategories
      : activeCategory?.subCategories || [];

  return (
    <div className="mt-8 sm:mt-12">
      {/* Category Tabs */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Filter categories"
          className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto px-2 py-1.5"
        >
          {/* "All" Tab */}
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-xs cursor-pointer ${
              activeTab === "all"
                ? "border-plum-900 bg-plum-900 text-gold-300 shadow-md ring-1 ring-gold-400/40"
                : "border-plum-200/90 bg-white/90 text-plum-900 hover:border-gold-300 hover:bg-plum-50/70"
            }`}
          >
            <LayoutGrid size={13} className={activeTab === "all" ? "text-gold-400" : "text-plum-400"} />
            <span>All Categories</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === "all"
                  ? "bg-plum-800 text-gold-300"
                  : "bg-plum-100/80 text-plum-700"
              }`}
            >
              {allSubCategories.length}
            </span>
          </button>

          {/* Individual Top-Level Categories */}
          {categories.map((cat) => {
            const isSelected = activeTab === cat.slug;
            const subCount = cat.subCategories.length;

            return (
              <button
                key={cat.slug}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => setActiveTab(cat.slug)}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-xs cursor-pointer ${
                  isSelected
                    ? "border-plum-900 bg-plum-900 text-gold-300 shadow-md ring-1 ring-gold-400/40"
                    : "border-plum-200/90 bg-white/90 text-plum-900 hover:border-gold-300 hover:bg-plum-50/70"
                }`}
              >
                <span>{cat.name}</span>
                {subCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-plum-800 text-gold-300"
                        : "bg-plum-100/80 text-plum-700"
                    }`}
                  >
                    {subCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategories Display Grid / Rail */}
      <div className="mt-9 sm:mt-12">
        {displayedSubCategories.length > 0 ? (
          <div>
            <ul className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto overflow-y-hidden px-2 pb-4 pt-1 sm:gap-8 lg:flex-wrap lg:justify-center lg:overflow-visible lg:gap-x-10 lg:gap-y-8">
              {displayedSubCategories.map((sub, i) => {
                const targetUrl = `/products?category=${sub.categorySlug}&subCategory=${sub.slug}`;

                return (
                  <li key={`${sub.categorySlug}-${sub.slug}`} className="shrink-0 snap-start">
                    <Link
                      href={targetUrl}
                      className="group flex w-24 flex-col items-center gap-2.5 sm:w-40 lg:w-44"
                    >
                      <span className="relative block size-24 shrink-0 overflow-hidden rounded-full ring-1 ring-ivory-300 transition-all duration-300 group-hover:shadow-xl group-hover:ring-2 group-hover:ring-gold-400 group-hover:-translate-y-1 sm:size-40 lg:size-44">
                        {sub.image ? (
                          sub.image.includes("res.cloudinary.com") || sub.image.includes("cloudinary") ? (
                            <CldImage
                              src={sub.image}
                              alt={sub.name}
                              width={192}
                              height={192}
                              priority={i < 4}
                              loading={i < 4 ? undefined : "lazy"}
                              className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110"
                            />
                          ) : (
                            <Image
                              src={sub.image}
                              alt={sub.name}
                              width={192}
                              height={192}
                              priority={i < 4}
                              loading={i < 4 ? undefined : "lazy"}
                              className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110"
                            />
                          )
                        ) : (
                          <GemImage
                            color={gemColorFor(sub.slug)}
                            seed={i * 7 + 3}
                            vignette={false}
                            className="size-full transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-110"
                          />
                        )}

                        {/* Combo badge if combo type */}
                        {sub.type === "COMBO" && (
                          <span className="absolute top-2 right-2 rounded-full bg-gold-500 px-2 py-0.5 text-[9px] font-bold tracking-wider text-plum-950 uppercase shadow-sm">
                            Combo
                          </span>
                        )}
                      </span>

                      {/* Subcategory Label */}
                      <span className="text-center text-xs font-semibold tracking-wider text-plum-900 uppercase transition-colors group-hover:text-gold-600 sm:text-sm">
                        {sub.name}
                      </span>

                      {/* Parent Category Hint in 'All' view */}
                      {activeTab === "all" && sub.categoryName && (
                        <span className="-mt-1.5 text-center text-[10px] tracking-wide text-plum-500/80">
                          {sub.categoryName}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Quick View All in Active Category Link */}
            {activeCategory && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/products?category=${activeCategory.slug}`}
                  className="group inline-flex items-center gap-2 rounded-full border border-plum-200/80 bg-white/90 px-5 py-2 text-xs font-semibold text-plum-900 shadow-xs transition-all hover:border-gold-400 hover:bg-plum-50 hover:text-gold-700"
                >
                  <span>Explore all in {activeCategory.name}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Standalone Top-Level Category fallback */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            {activeCategory ? (
              <div className="flex flex-col items-center">
                <Link
                  href={`/products?category=${activeCategory.slug}`}
                  className="group flex flex-col items-center gap-4"
                >
                  <span className="relative block size-28 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-400/60 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105 sm:size-44">
                    {activeCategory.image ? (
                      <Image
                        src={activeCategory.image}
                        alt={activeCategory.name}
                        width={192}
                        height={192}
                        priority
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <GemImage
                        color={gemColorFor(activeCategory.slug)}
                        seed={42}
                        vignette={false}
                        className="size-full"
                      />
                    )}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-plum-950 uppercase tracking-wider group-hover:text-gold-600 transition-colors sm:text-lg">
                      {activeCategory.name}
                    </h3>
                    <p className="text-xs text-plum-600 max-w-xs">
                      Explore our complete {activeCategory.name} collection.
                    </p>
                  </div>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-xl bg-plum-900 px-5 py-2.5 text-xs font-semibold text-gold-300 shadow-md transition-colors group-hover:bg-plum-800">
                    <span>Shop Collection</span>
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-plum-600">No categories found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
