import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import dbConnect from "@/lib/db";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();
  
  // Find customer profile linked to the user
  const customer = await Customer.findOne({ userId: (session.user as any).id }).lean();

  if (!customer) {
    return (
      <div className="bg-white rounded-2xl border border-plum-100 p-8 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-plum-900">Profile Not Found</h2>
        <p className="mt-2 text-plum-500">Could not locate your customer profile.</p>
      </div>
    );
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
              firstName: customer.profile?.firstName || "",
              lastName: customer.profile?.lastName || "",
              email: customer.contact?.email || session.user.email || "",
              phone: customer.contact?.phone || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
