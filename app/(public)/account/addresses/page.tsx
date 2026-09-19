import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import AddressManager from "@/components/public/account/address-manager";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();

  const userId = (session.user as any).id;
  let customer = await Customer.findOne({ userId }).lean();

  if (!customer && session.user.email) {
    customer = await Customer.findOne({ "contact.email": session.user.email }).lean();
  }

  const addresses = customer?.addresses ? JSON.parse(JSON.stringify(customer.addresses)) : [];

  return <AddressManager addresses={addresses} />;
}
