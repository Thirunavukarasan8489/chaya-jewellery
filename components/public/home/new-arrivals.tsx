import { ProductRail } from "@/components/public/product/product-rail";
import { SectionHeading } from "@/components/public/ui/section-heading";
import { getNewArrivals } from "@/lib/services/product-service";
import { flattenVariants } from "@/lib/utils";

export async function NewArrivals() {
  const arrivals = await getNewArrivals();
  if (!arrivals || arrivals.length === 0) return null;

  return (
    <section className="shell gutter py-12 sm:py-16 lg:py-20">
      <SectionHeading
        eyebrow="Just landed"
        title="New arrivals"
        body="The latest additions to the collection, freshly finished."
        href="/products"
      />
      <div className="mt-7">
        <ProductRail products={flattenVariants(arrivals)} />
      </div>
    </section>
  );
}
