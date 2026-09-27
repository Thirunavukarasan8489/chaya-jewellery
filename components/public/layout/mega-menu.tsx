"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Gem,
  ArrowUpRight,
  Layers,
  ShoppingBag,
  Package,
} from "lucide-react";
import type { MegaMenuData } from "@/lib/services/category-service";

interface MegaMenuProps {
  data: MegaMenuData;
  onClose?: () => void;
}

export function MegaMenu({ data, onClose }: MegaMenuProps) {
  const { categories = [], combosByCategory = [], totalCombos = 0 } = data;

  // Selected key: category id or "combos"
  const [selectedKey, setSelectedKey] = useState<string>(
    categories.length > 0 ? categories[0].id : "combos"
  );

  const isComboSelected = selectedKey === "combos";
  const activeCategory = categories.find((c) => c.id === selectedKey);

  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-230 max-w-[95vw] rounded-2xl border border-gold-500/30 bg-ivory-50/98 backdrop-blur-xl shadow-2xl shadow-plum-950/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseLeave={onClose}
    >
      {/* Top Luxury Accent Strip */}
      <div className="h-1 w-full bg-linear-to-r from-plum-900 via-gold-500 to-plum-900" />

      <div className="grid grid-cols-[280px_1fr] min-h-105">
        {/* Left Column: Categories & Combos selector */}
        <div className="border-r border-ivory-300 bg-ivory-100/70 p-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 pt-1 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-gold-700 uppercase">
                Categories
              </span>
              <span className="text-[10px] font-medium text-plum-500">
                {categories.length} Collections
              </span>
            </div>

            <div className="space-y-1 max-h-72.5 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isActive = selectedKey === cat.id;
                const subCount = cat.subCategories?.length || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={() => setSelectedKey(cat.id)}
                    onClick={() => setSelectedKey(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                      isActive
                        ? "bg-plum-900 text-gold-300 shadow-md font-semibold"
                        : "text-plum-900 hover:bg-plum-900/8 hover:text-plum-950"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Gem
                        size={14}
                        className={
                          isActive ? "text-gold-400 shrink-0" : "text-gold-600 shrink-0"
                        }
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {subCount > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-plum-800 text-gold-300 border border-gold-400/30"
                              : "bg-ivory-300 text-plum-700"
                          }`}
                        >
                          {subCount}
                        </span>
                      )}
                      <ChevronRight
                        size={14}
                        className={isActive ? "text-gold-400" : "text-plum-400"}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Distinct Combos & Sets Button */}
            <div className="pt-2">
              <div className="border-t border-ivory-300 my-2" />
              <button
                type="button"
                onMouseEnter={() => setSelectedKey("combos")}
                onClick={() => setSelectedKey("combos")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                  isComboSelected
                    ? "bg-linear-to-r from-plum-950 to-plum-900 text-gold-300 border-gold-500/50 shadow-md"
                    : "bg-gold-500/10 hover:bg-gold-500/20 text-plum-950 border-gold-500/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers
                    size={15}
                    className={
                      isComboSelected ? "text-gold-300" : "text-gold-600"
                    }
                  />
                  <span>Combos & Matching Sets</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-800 border border-gold-400/40">
                  {totalCombos > 0 ? `${totalCombos} Sets` : "Special"}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom All Catalogue Link */}
          <div className="pt-3 border-t border-ivory-300">
            <Link
              href="/products"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-semibold text-plum-900 bg-ivory-200 hover:bg-plum-900 hover:text-gold-300 transition-colors"
            >
              <ShoppingBag size={14} />
              <span>View Full Catalogue</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Column: Subcategories or Grouped Combos */}
        <div className="p-6 bg-ivory-50 flex flex-col justify-between max-h-115 overflow-y-auto">
          {/* View 1: Category Subcategories */}
          {!isComboSelected && activeCategory && (
            <div className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
                <div>
                  <h3 className="text-base font-serif font-bold text-plum-950 flex items-center gap-2">
                    <span>{activeCategory.name}</span>
                    <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-300">
                      {activeCategory.subCategories.length} Subcategories
                    </span>
                  </h3>
                  {activeCategory.description && (
                    <p className="text-xs text-plum-700/80 line-clamp-1 mt-0.5">
                      {activeCategory.description}
                    </p>
                  )}
                </div>

                <Link
                  href={`/products?category=${activeCategory.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gold-700 hover:text-plum-950 transition-colors group"
                >
                  <span>Explore all {activeCategory.name}</span>
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>

              {/* Subcategories Grid */}
              {activeCategory.subCategories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeCategory.subCategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/products?category=${activeCategory.slug}&subCategory=${sub.slug}`}
                      onClick={onClose}
                      className="group p-3 rounded-xl border border-ivory-300/80 bg-white hover:border-gold-400 hover:bg-gold-50/40 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-plum-900 group-hover:text-gold-700 transition-colors truncate">
                            {sub.name}
                          </h4>
                          <ArrowUpRight
                            size={12}
                            className="text-plum-400 group-hover:text-gold-600 transition-colors"
                          />
                        </div>
                        {sub.description && (
                          <p className="text-[11px] text-plum-600 line-clamp-2 leading-relaxed">
                            {sub.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gold-700 mt-2 flex items-center gap-1">
                        <span>Shop Designs</span>
                        <ChevronRight size={10} />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 rounded-2xl border border-dashed border-ivory-300 bg-ivory-100/40 text-center space-y-3">
                  <Package size={28} className="mx-auto text-gold-600/70" />
                  <div>
                    <h4 className="text-sm font-bold text-plum-950">
                      Explore All {activeCategory.name}
                    </h4>
                    <p className="text-xs text-plum-600 max-w-sm mx-auto mt-1">
                      Browse all handcrafted jewellery pieces in our {activeCategory.name} collection.
                    </p>
                  </div>
                  <Link
                    href={`/products?category=${activeCategory.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-plum-900 text-gold-300 hover:bg-plum-950 shadow-sm"
                  >
                    <span>View Collection</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* View 2: Grouped Combos by Category */}
          {isComboSelected && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-ivory-300">
                <div>
                  <h3 className="text-base font-serif font-bold text-plum-950 flex items-center gap-2">
                    <Layers size={18} className="text-gold-600" />
                    <span>Jewellery Combos & Matching Sets</span>
                  </h3>
                  <p className="text-xs text-plum-700/80 mt-0.5">
                    Coordinated matching sets and bridal combinations at exclusive bundle savings.
                  </p>
                </div>

                <Link
                  href="/products?type=combo"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gold-700 hover:text-plum-950 transition-colors group"
                >
                  <span>All Combos</span>
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>

              {/* Combos Grouped by Category */}
              {combosByCategory.length > 0 ? (
                <div className="space-y-4">
                  {combosByCategory.map((group) => (
                    <div key={group.categorySlug} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-gold-500" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gold-800">
                          {group.categoryName} Sets
                        </h4>
                        <div className="h-px flex-1 bg-ivory-300" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {group.combos.map((combo) => (
                          <Link
                            key={combo.id}
                            href={`/products?category=${group.categorySlug}&subCategory=${combo.slug}`}
                            onClick={onClose}
                            className="group p-3 rounded-xl border border-ivory-300 bg-white hover:border-gold-500 hover:bg-gold-50/30 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h5 className="text-xs font-bold text-plum-950 group-hover:text-gold-700 transition-colors line-clamp-1">
                                  {combo.name}
                                </h5>
                                {combo.comboDiscount && combo.comboDiscount > 0 ? (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {combo.comboDiscount}% OFF
                                  </span>
                                ) : (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-800 border border-gold-300">
                                    COMBO
                                  </span>
                                )}
                              </div>

                              {combo.description && (
                                <p className="text-[11px] text-plum-600 line-clamp-1 mb-2">
                                  {combo.description}
                                </p>
                              )}

                              {/* Combo Includes List */}
                              {combo.comboIncludes && combo.comboIncludes.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-plum-700 bg-ivory-100 px-2 py-1 rounded-lg border border-ivory-200">
                                  <Layers size={11} className="text-gold-600 shrink-0" />
                                  <span className="truncate">
                                    Includes:{" "}
                                    <strong className="text-plum-900 font-semibold">
                                      {combo.comboIncludes
                                        .map((c) => c.name)
                                        .join(" + ")}
                                    </strong>
                                  </span>
                                </div>
                              )}
                            </div>

                            <span className="text-[10px] font-bold text-gold-700 mt-2.5 flex items-center gap-1">
                              <span>Explore Set</span>
                              <ChevronRight size={11} />
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 rounded-2xl border border-dashed border-ivory-300 bg-ivory-100/40 text-center space-y-3">
                  <Layers size={28} className="mx-auto text-gold-600/70" />
                  <div>
                    <h4 className="text-sm font-bold text-plum-950">
                      Custom Matching Sets & Combos
                    </h4>
                    <p className="text-xs text-plum-600 max-w-sm mx-auto mt-1">
                      Our bridal and matching jewellery combos are handcrafted on order. Explore our individual collections or contact us for bespoke styling.
                    </p>
                  </div>
                  <Link
                    href="/products"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-plum-900 text-gold-300 hover:bg-plum-950 shadow-sm"
                  >
                    <span>Browse All Jewellery</span>
                    <ArrowUpRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Quick Consultation Strip */}
          <div className="mt-4 pt-3 border-t border-ivory-300 flex items-center justify-between text-[11px] text-plum-600">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Need help choosing a set? Connect with our jewellery stylists</span>
            </span>
            <Link
              href="/contact"
              onClick={onClose}
              className="font-bold text-gold-700 hover:text-plum-950 underline underline-offset-2"
            >
              Get Styling Assistance →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
