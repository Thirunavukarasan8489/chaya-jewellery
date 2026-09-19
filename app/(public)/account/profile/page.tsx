import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import dbConnect from "@/lib/db";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();
  
  const userId = (session.user as any).id;
  let customer = await Customer.findOne({ userId }).lean();

  if (!customer && session.user.email) {
    customer = await Customer.findOne({ "contact.email": session.user.email }).lean();
    if (customer && userId && !(customer as any).userId) {
      await Customer.findByIdAndUpdate((customer as any)._id, { $set: { userId } });
    }
  }

  if (!customer && (userId || session.user.email)) {
    const fullName = session.user.name || "Customer";
    const nameParts = fullName.trim().split(" ");
    const createdCustomer = await Customer.create({
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
    customer = createdCustomer.toObject();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-plum-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-plum-100 bg-plum-50/30">
          <h1 className="text-2xl font-bold text-plum-950">Profile Settings</h1>
          <p className="text-sm text-plum-600 mt-1">
            Update your personal information and contact details.
          </p>
        </div>
        
        <div className="p-6 sm:p-8">
          <ProfileForm 
            userId={(session.user as any).id}
            initialData={{
              firstName: customer?.profile?.firstName || "",
              lastName: customer?.profile?.lastName || "",
              email: customer?.contact?.email || session.user.email || "",
              phone: customer?.contact?.phone || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
