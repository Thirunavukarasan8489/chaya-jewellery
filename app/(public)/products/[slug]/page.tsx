import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MessageCircle,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { AddToCart } from "@/components/public/cart/add-to-cart";
import { ProductGallery } from "@/components/public/product/product-gallery";
import { ProductRail } from "@/components/public/product/product-rail";
import { Badge } from "@/components/public/ui/badge";
import { Breadcrumbs } from "@/components/public/ui/page-header";
import { BackButton } from "@/components/public/ui/back-button";
import { ProductPurchaseOptions } from "@/components/public/product/product-purchase-options";
import { ProductAccordion } from "@/components/public/product/product-accordion";
import { getCategoryBySlug } from "@/lib/services/category-service";
import { Rating } from "@/components/public/ui/rating";
import { SectionHeading } from "@/components/public/ui/section-heading";
import {
  getProductBySlug,
  getProducts,
  getRelatedProducts,
} from "@/lib/services/product-service";
import { NAV_DATA } from "@/lib/utils";
import { availableQuantity, type Product } from "@/lib/types";

export async function generateStaticParams() {
  const products = await getProducts();
  return products
    .filter((p: Product) => p.published)
    .map((product: Product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.seo?.metaTitle || `${product.name} | Chaya Jewellery`,
    description: product.seo?.metaDescription || product.shortDescription,
    keywords: product.seo?.keywords,
    openGraph: product.seo?.ogImage
      ? {
          images: [{ url: product.seo.ogImage }],
        }
      : undefined,
  };
}

export default async function ProductDetailPage(
  props: PageProps<"/products/[slug]">,
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  const business = NAV_DATA.business;
  if (!product || !product.published) notFound();
  const [category, related] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getRelatedProducts(product.id, product.categorySlug),
  ]);

  // Combine primary image and gallery images (avoiding duplicates)
  const allImages: { url: string; altText?: string }[] = [];
  if (product.primaryImage?.url) {
    allImages.push(product.primaryImage);
  }
  if (product.images && product.images.length > 0) {
    for (const img of product.images) {
      if (img?.url && !allImages.some((existing) => existing.url === img.url)) {
        allImages.push(img);
      }
    }
  }

  return (
    <>
      <div className="shell gutter pt-5 pb-1 flex items-center gap-3 flex-wrap">
        <BackButton fallbackHref="/products" label="Back" />
        <div className="h-4 w-px bg-plum-200/70 hidden sm:block" />
        <Breadcrumbs
          items={[
            { label: "Products", href: "/products" },
            ...(category
              ? [
                  {
                    label: category.name.split(" / ")[0],
                    href: `/collections/${category.slug}`,
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="shell gutter py-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-12 lg:py-10">
        <div className="lg:sticky lg:top-28">
          <ProductGallery
            color={product.gemColor}
            count={allImages.length || product.gallery}
            images={allImages.length > 0 ? allImages : undefined}
            name={product.name}
          />
        </div>

        <div className="mt-7 lg:mt-0">
          {product && (
            <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-gold-700 uppercase">
              {product.categorySlug}
            </p>
          )}

          <h1 className="mt-2 text-[1.75rem] leading-tight font-semibold text-plum-900 sm:text-4xl">
            {product.name}
          </h1>

          <ProductPurchaseOptions
            product={product}
            category={category}
            business={business}
          />

          <ul className="mt-8 grid grid-cols-3 gap-3 border-y border-ivory-300 py-4">
            {[
              { icon: Truck, label: "Insured delivery" },
              { icon: RefreshCcw, label: "7-day returns" },
              { icon: ShieldCheck, label: "Certified authentic" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <Icon size={19} className="text-gold-700" strokeWidth={1.9} />
                <span className="text-[0.6875rem] leading-tight font-medium text-plum-800">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          {/* Luxury Accordion: About this piece, Specifications & Shipping */}
          <ProductAccordion product={product} defaultOpenSection="about" />
        </div>
      </div>

      {related.length > 0 && (
        <section className="relative w-full max-w-full overflow-hidden shell gutter py-12 sm:py-16">
          <SectionHeading
            eyebrow="You may also like"
            title="Similar Products"
            href="/products"
          />
          <div className="mt-7">
            <ProductRail products={related} />
          </div>
        </section>
      )}
    </>
  );
}
