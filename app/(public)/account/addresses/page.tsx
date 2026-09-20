import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import AddressManager from "@/components/public/account/address-manager";
import mongoose from "mongoose";

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
    customer = await Customer.findOne({
      "contact.email": session.user.email,
    }).lean();
    if (customer && userId && !(customer as any).userId) {
      await Customer.findByIdAndUpdate((customer as any)._id, {
        $set: { userId },
      });
    }
  }

  if (!customer && (userId || session.user.email)) {
    const fullName = session.user.name || "Customer";
    const nameParts = fullName.trim().split(" ");
    const newCustomer = await Customer.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      type: "PERSONAL",
      contact: { email: session.user.email || "" },
      profile: {
        firstName: nameParts[0] || "Customer",
        lastName: nameParts.slice(1).join(" ") || "",
      },
      addresses: [],
      metrics: { totalOrders: 0, totalSpend: 0 },
    });
    customer = newCustomer.toObject();
  }

  const addresses = customer?.addresses
    ? JSON.parse(JSON.stringify(customer.addresses))
    : [];

  return <AddressManager addresses={addresses} />;
}
