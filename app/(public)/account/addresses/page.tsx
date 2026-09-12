import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Customer } from "@/lib/models/customer";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import { Plus, MapPin, Edit2, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();
  
  const customer = await Customer.findOne({ userId: (session.user as any).id }).lean();
  const addresses = customer?.addresses || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-plum-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-plum-100 bg-plum-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-plum-950">Saved Addresses</h1>
            <p className="text-sm text-plum-600 mt-1">
              Manage your shipping and billing addresses.
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-600 transition-colors">
            <Plus size={18} />
            Add New Address
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
          {addresses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-plum-100 rounded-2xl">
              <MapPin className="mx-auto h-12 w-12 text-plum-200" />
              <h3 className="mt-4 text-lg font-semibold text-plum-900">No addresses saved</h3>
              <p className="mt-1 text-sm text-plum-500">
                You haven&apos;t added any shipping addresses yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address: any, index: number) => (
                <div key={index} className="relative rounded-2xl border border-plum-200 p-6 hover:shadow-md transition-shadow group">
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-plum-400 hover:text-gold-600 bg-plum-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1.5 text-plum-400 hover:text-red-600 bg-plum-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {index === 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 mb-3">
                      Default Shipping
                    </span>
                  )}
                  
                  <h3 className="font-semibold text-plum-900 text-lg">{address.name}</h3>
                  <p className="text-plum-600 text-sm mt-1">{address.phone}</p>
                  
                  <div className="mt-4 text-sm text-plum-700 space-y-1">
                    <p>{address.street1}</p>
                    {address.street2 && <p>{address.street2}</p>}
                    <p>{address.city}, {address.state} {address.zip}</p>
                    <p>{address.country}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
