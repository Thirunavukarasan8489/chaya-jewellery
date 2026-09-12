import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import dbConnect from "@/lib/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/public/ui/page-header";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  let customerData = null;

  if (session && session.user) {
    await dbConnect();
    const customer = await Customer.findOne({ userId: (session.user as any).id }).lean();
    if (customer) {
      customerData = JSON.parse(JSON.stringify(customer));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Secure Checkout"
        body="Review your cart, provide your details, and place your order safely."
        breadcrumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />

      <div className="shell gutter py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <CheckoutClient customer={customerData} />
        </div>
      </div>
    </>
  );
}
