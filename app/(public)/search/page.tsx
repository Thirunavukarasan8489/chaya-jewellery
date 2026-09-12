import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/public/product/product-rail";
import { SearchInput } from "@/components/public/product/search-input";
import { buttonStyles } from "@/components/public/ui/button";
import { EmptyState, PageHeader } from "@/components/public/ui/page-header";
import { getCategories } from "@/lib/services/category-service";
import { getBestsellers, getProducts } from "@/lib/services/product-service";
import { applyFilters, toQuery } from "@/lib/filters";
import { categoryTerms } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Chaya Jewellery catalogue by stone, origin, carat or SKU.",
};

const suggestions = ["Unheated", "Ceylon", "Bracelet", "Rudraksha", "Emerald"];

export default async function SearchPage(props: PageProps<"/search">) {
  const query = toQuery(await props.searchParams);
  const term = query.q?.trim() ?? "";
  const products = await getProducts();
  const results = term ? applyFilters(products, query) : [];
  
  const categories = !term ? await getCategories() : [];
  const bestsellers = !term ? await getBestsellers() : [];

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title={term ? `Results for “${term}”` : "Search the catalogue"}
        body={
          term
            ? `${results.length} ${results.length === 1 ? "match" : "matches"} across stones, origins and SKUs.`
            : "Search by stone name, origin, carat weight or SKU."
        }
        breadcrumbs={[{ label: "Search" }]}
      />

      <div className="shell gutter py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<div className="skeleton h-14 rounded-full" />}>
            <SearchInput />
          </Suspense>

          {!term && (
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <li key={s}>
                  <Link
                    href={`/search?q=${encodeURIComponent(s)}`}
                    className="inline-flex h-9 items-center rounded-full border border-plum-900/15 bg-white px-3.5 text-[0.8125rem] font-medium text-plum-800 hover:border-gold-400"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10">
          {term ? (
            results.length > 0 ? (
              <ProductGrid products={results} />
            ) : (
              <EmptyState
                title={`Nothing found for “${term}”`}
                body="Try a broader term such as the stone name, or send us an enquiry — we source specific stones on request all the time."
                action={
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/products" className={buttonStyles()}>
                      Browse everything
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
            )
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-plum-900">
                  Browse by stone
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/collections/${cat.slug}`}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-plum-900/15 bg-white px-3.5 text-[0.8125rem] font-medium text-plum-800 hover:border-gold-400"
                      >
                        <span
                          aria-hidden
                          className="size-2.5 rotate-45 rounded-[2px]"
                          style={{ background: cat.gemColor }}
                        />
                        {categoryTerms(cat.name).primary}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <h2 className="mb-4 font-display text-xl font-semibold text-plum-900">
                Popular right now
              </h2>
              <ProductGrid products={bestsellers} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
