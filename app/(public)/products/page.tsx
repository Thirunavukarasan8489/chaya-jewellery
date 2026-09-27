import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/public/product/product-rail";
import {
  ActiveFiltersBar,
  FilterBar,
  FilterSidebar,
} from "@/components/public/product/product-filters";
import { buttonStyles } from "@/components/public/ui/button";
import { EmptyState, PageHeader } from "@/components/public/ui/page-header";
import { getCategories, getPublicSubCategories } from "@/lib/services/category-service";
import { getProducts } from "@/lib/services/product-service";
import { applyFilters, toQuery } from "@/lib/filters";
import { flattenVariants } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Products | Chaya Jewellery",
  description:
    "Explore our complete collection of handcrafted jewellery — exquisite necklaces, bridal sets, elegant earrings, bangles, pendants, and curated combo sets.",
};

export default async function ProductsPage(props: PageProps<"/products">) {
  const query = toQuery(await props.searchParams);
  const [products, categories, subCategories] = await Promise.all([
    getProducts(),
    getCategories(),
    getPublicSubCategories(),
  ]);
  const results = flattenVariants(applyFilters(products, query));

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="All Products"
        body="Discover our signature collection of handcrafted jewellery, traditional sets, and contemporary everyday designs."
        breadcrumbs={[{ label: "All Products" }]}
      />

      <div className="shell gutter">
        <Suspense fallback={<div className="h-16" />}>
          <FilterBar
            total={results.length}
            categories={categories}
            subCategories={subCategories}
          />
        </Suspense>

        <div className="py-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
          <Suspense fallback={null}>
            <FilterSidebar
              categories={categories}
              subCategories={subCategories}
            />
          </Suspense>

          <div>
            <Suspense fallback={null}>
              <ActiveFiltersBar
                categories={categories}
                subCategories={subCategories}
              />
            </Suspense>

            {results.length > 0 ? (
              <ProductGrid products={results} />
            ) : (
              <EmptyState
                title="No jewellery matches those filters"
                body="Try adjusting your filters or clearing some selections to explore our full catalogue."
                action={
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/products" className={buttonStyles()}>
                      Clear all filters
                    </Link>
                    <Link
                      href="/contact"
                      className={buttonStyles({ variant: "outline" })}
                    >
                      Contact our stylists
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

