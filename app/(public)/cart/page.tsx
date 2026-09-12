import type { Metadata } from "next";
import { CartView } from "./cart-view";
import { PageHeader } from "@/components/public/ui/page-header";


export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the gemstones in your Chaya Jewellery cart before checkout.",
};

export default async function CartPage() {
  const settings = { commerce: { flatShippingFee: 200, freeShippingThreshold: 50000 } }; // fallback or service
  return (
    <>
      <PageHeader
        eyebrow="Cart"
        title="Your cart"
        breadcrumbs={[{ label: "Cart" }]}
      />
      <div className="shell gutter py-8 sm:py-12">
        <CartView settings={settings.commerce} />
      </div>
    </>
  );
}
