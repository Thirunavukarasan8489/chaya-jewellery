import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/public/product/product-rail";
import {
  FilterBar,
  FilterSidebar,
} from "@/components/public/product/product-filters";
import { buttonStyles } from "@/components/public/ui/button";
import { EmptyState, PageHeader } from "@/components/public/ui/page-header";
import { getCategories } from "@/lib/services/category-service";
import { getProducts } from "@/lib/services/product-service";
import { applyFilters, toQuery } from "@/lib/filters";
import { flattenVariants } from "@/lib/utils";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse every certified natural gemstone in the Chaya Jewellery catalogue — ruby, blue sapphire, yellow sapphire, emerald, pearl, coral, bracelets and rudraksha.",
};

export default async function ProductsPage(props: PageProps<"/products">) {
  const query = toQuery(await props.searchParams);
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ]);
  const results = flattenVariants(applyFilters(products, query));

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="All Products"
        body="Every product below is natural and independently certified. Treatments are disclosed on each product page."
        breadcrumbs={[{ label: "All Products" }]}
      />

      <div className="shell gutter">
        <Suspense fallback={<div className="h-16" />}>
          <FilterBar total={results.length} categories={categories} />
        </Suspense>

        <div className="py-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
          <Suspense fallback={null}>
            <FilterSidebar categories={categories} />
          </Suspense>

          <div>
            {results.length > 0 ? (
              <ProductGrid products={results} />
            ) : (
              <EmptyState
                title="No stones match those filters"
                body="Try widening the price range, or tell us what you are looking for and we will source it."
                action={
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/products" className={buttonStyles()}>
                      Clear filters
                    </Link>
                    <Link
                      href="/contact"
                      className={buttonStyles({ variant: "outline" })}
                    >
                      Request a stone
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
