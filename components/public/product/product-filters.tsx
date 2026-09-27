"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/public/ui/button";
import {
  activeFilterCount,
  itemTypeOptions,
  priceBands,
  purchaseOptions,
  sortOptions,
  toQuery,
} from "@/lib/filters";
import { cn } from "@/lib/utils";

export interface FilterSubCategory {
  id: string;
  name: string;
  slug: string;
  type?: string;
  categorySlug?: string;
  categoryName?: string;
}

/**
 * Filters live in the URL so a filtered listing is shareable, bookmarkable and
 * survives the back button. On mobile they open in a bottom sheet.
 */
export function useFilterState(lockCategory?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = React.useMemo(
    () => toQuery(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const count = activeFilterCount(
    lockCategory ? { ...query, category: undefined } : query,
  );

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      // Tapping an already-active chip clears it — chips act as toggles.
      if (value === null || params.get(key) === value) {
        params.delete(key);
        // If clearing category, also clear subcategory
        if (key === "category") {
          params.delete("subCategory");
        }
      } else {
        params.set(key, value);
        // If switching category, clear subcategory so stale subcategory doesn't remain
        if (key === "category") {
          params.delete("subCategory");
        }
      }

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const removeParam = React.useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      if (key === "category") {
        params.delete("subCategory");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearAll = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["category", "subCategory", "type", "price", "availability", "purchase", "q"]) {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return { query, count, setParam, removeParam, clearAll };
}

export function Facets({
  lockCategory,
  query,
  setParam,
  categories = [],
  subCategories = [],
}: {
  lockCategory?: string;
  query: ReturnType<typeof toQuery>;
  setParam: (key: string, value: string | null) => void;
  categories: any[];
  subCategories?: FilterSubCategory[];
}) {
  const activeCategory = lockCategory || query.category;

  const relevantSubCategories = React.useMemo(() => {
    if (!subCategories || subCategories.length === 0) return [];
    if (activeCategory) {
      return subCategories.filter(
        (sc) => sc.categorySlug === activeCategory,
      );
    }
    return subCategories;
  }, [subCategories, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Parent Category */}
      {!lockCategory && (
        <Facet title="Category">
          {categories?.map((cat: any) => {
            const displayName = cat.name.split(" / ")[0];
            return (
              <Chip
                key={cat.slug}
                active={query.category === cat.slug}
                onClick={() => setParam("category", cat.slug)}
              >
                {displayName}
              </Chip>
            );
          })}
        </Facet>
      )}

      {/* SubCategory Filter */}
      {relevantSubCategories.length > 0 && (
        <Facet title={activeCategory ? "SubCategory" : "All SubCategories"}>
          {relevantSubCategories.map((sub) => (
            <Chip
              key={sub.slug}
              active={query.subCategory === sub.slug}
              onClick={() => setParam("subCategory", sub.slug)}
            >
              {sub.name}
            </Chip>
          ))}
        </Facet>
      )}

      {/* Item Type (Single vs Combo) */}
      <Facet title="Item Type">
        {itemTypeOptions.map((option) => (
          <Chip
            key={option.value}
            active={query.type === option.value}
            onClick={() => setParam("type", option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </Facet>

      {/* Price Ranges */}
      <Facet title="Price Range">
        {priceBands.map((band) => (
          <Chip
            key={band.value}
            active={query.price === band.value}
            onClick={() => setParam("price", band.value)}
          >
            {band.label}
          </Chip>
        ))}
      </Facet>

      {/* Availability */}
      <Facet title="Availability">
        <Chip
          active={query.availability === "in-stock"}
          onClick={() => setParam("availability", "in-stock")}
        >
          In stock only
        </Chip>
      </Facet>

      {/* Purchase Options */}
      <Facet title="How to purchase">
        {purchaseOptions.map((option) => (
          <Chip
            key={option.value}
            active={query.purchase === option.value}
            onClick={() => setParam("purchase", option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </Facet>
    </div>
  );
}

/** Active filter pills display bar */
export function ActiveFiltersBar({
  lockCategory,
  categories = [],
  subCategories = [],
}: {
  lockCategory?: string;
  categories: any[];
  subCategories?: FilterSubCategory[];
}) {
  const { query, removeParam, clearAll } = useFilterState(lockCategory);

  const activeCategory = categories.find((c) => c.slug === query.category);
  const activeSubCategory = subCategories.find((s) => s.slug === query.subCategory);
  const activePrice = priceBands.find((p) => p.value === query.price);
  const activeType = itemTypeOptions.find((t) => t.value === query.type);
  const activePurchase = purchaseOptions.find((p) => p.value === query.purchase);

  const hasFilters = Boolean(
    (!lockCategory && query.category) ||
    query.subCategory ||
    query.type ||
    query.price ||
    query.availability ||
    query.purchase ||
    query.q
  );

  if (!hasFilters) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-ivory-300 pb-4">
      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider mr-1">
        Active Filters:
      </span>

      {query.q && (
        <FilterPill label={`Search: “${query.q}”`} onRemove={() => removeParam("q")} />
      )}

      {!lockCategory && query.category && (
        <FilterPill
          label={`Category: ${activeCategory ? activeCategory.name.split(" / ")[0] : query.category}`}
          onRemove={() => removeParam("category")}
        />
      )}

      {query.subCategory && (
        <FilterPill
          label={`SubCategory: ${activeSubCategory ? activeSubCategory.name : query.subCategory}`}
          onRemove={() => removeParam("subCategory")}
        />
      )}

      {query.type && (
        <FilterPill
          label={`Type: ${activeType ? activeType.label : query.type}`}
          onRemove={() => removeParam("type")}
        />
      )}

      {query.price && (
        <FilterPill
          label={`Price: ${activePrice ? activePrice.label : query.price}`}
          onRemove={() => removeParam("price")}
        />
      )}

      {query.availability === "in-stock" && (
        <FilterPill label="In Stock Only" onRemove={() => removeParam("availability")} />
      )}

      {query.purchase && (
        <FilterPill
          label={`Purchase: ${activePurchase ? activePurchase.label : query.purchase}`}
          onRemove={() => removeParam("purchase")}
        />
      )}

      <button
        type="button"
        onClick={clearAll}
        className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-plum-700 hover:text-gold-700 underline-offset-4 hover:underline transition-colors cursor-pointer"
      >
        <RotateCcw size={12} />
        Reset all
      </button>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400 bg-gold-50/80 dark:bg-gold-950/40 px-3 py-1 text-xs font-medium text-plum-900 shadow-2xs transition-colors">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="size-4 inline-flex items-center justify-center rounded-full text-plum-500 hover:bg-gold-200 hover:text-plum-950 transition-colors"
      >
        <X size={11} />
      </button>
    </span>
  );
}

/** Sticky bar: filter trigger, result count and sort. */
export function FilterBar({
  total,
  lockCategory,
  categories = [],
  subCategories = [],
}: {
  total: number;
  lockCategory?: string;
  categories: any[];
  subCategories?: FilterSubCategory[];
}) {
  const { query, count, setParam, clearAll } = useFilterState(lockCategory);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  return (
    <>
      <div className="sticky top-[5.75rem] z-30 -mx-4 border-y border-ivory-300 bg-ivory-100/92 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-[6.5rem]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSheetOpen(true)}
            className="lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters
            {count > 0 && (
              <span className="grid size-5 place-items-center rounded-none bg-gold-500 text-[0.625rem] font-bold text-plum-950">
                {count}
              </span>
            )}
          </Button>

          <p className="text-xs text-ink-muted lg:text-sm">
            <span className="font-semibold text-plum-900 tabular-nums">
              {total}
            </span>{" "}
            {total === 1 ? "piece" : "pieces"}
          </p>

          <label className="relative ml-auto shrink-0">
            <span className="sr-only">Sort products</span>
            <select
              value={query.sort ?? "featured"}
              onChange={(e) => setParam("sort", e.target.value)}
              className="h-11 appearance-none rounded-none border border-plum-900/15 bg-white py-0 pr-9 pl-4 text-sm font-medium text-plum-900"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-plum-500"
            />
          </label>
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            tabIndex={-1}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-plum-950/55 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter products"
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-ivory-100 pb-[env(safe-area-inset-bottom)]"
            style={{ animation: "sheet-in .3s var(--ease-out-soft) both" }}
          >
            <div className="relative flex shrink-0 items-center justify-between border-b border-ivory-300 px-4 pt-4 pb-3">
              <span
                aria-hidden
                className="absolute inset-x-0 top-1.5 mx-auto h-1 w-10 rounded-none bg-plum-300"
              />
              <h2 className="text-base font-semibold text-plum-900">Filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="grid size-9 place-items-center rounded-none text-plum-700 hover:bg-plum-900/6"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5">
              <Facets
                lockCategory={lockCategory}
                query={query}
                setParam={setParam}
                categories={categories}
                subCategories={subCategories}
              />
            </div>

            <div className="flex shrink-0 gap-3 border-t border-ivory-300 px-4 py-3">
              <Button variant="outline" full onClick={clearAll}>
                Clear all
              </Button>
              <Button full onClick={() => setSheetOpen(false)}>
                Show {total}
              </Button>
            </div>
          </div>

          <style>{`
            @keyframes sheet-in {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

/** Always-visible facet list for wide screens. */
export function FilterSidebar({
  lockCategory,
  categories = [],
  subCategories = [],
}: {
  lockCategory?: string;
  categories: any[];
  subCategories?: FilterSubCategory[];
}) {
  const { query, count, setParam, clearAll } = useFilterState(lockCategory);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[9.5rem]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-plum-900">Refine</h2>
          {count > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-gold-700 underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="mt-5 space-y-6">
          <Facets
            lockCategory={lockCategory}
            query={query}
            setParam={setParam}
            categories={categories}
            subCategories={subCategories}
          />
        </div>
      </div>
    </aside>
  );
}

function Facet({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink uppercase">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3.5 text-[0.8125rem] font-medium transition-colors cursor-pointer",
        active
          ? "border-gold-500 bg-gold-500 text-plum-950 font-semibold shadow-xs"
          : "border-plum-900/15 bg-white text-plum-800 hover:border-plum-900/35 hover:bg-gold-50/50",
      )}
    >
      {children}
      {active && <Check size={13} strokeWidth={3} />}
    </button>
  );
}

