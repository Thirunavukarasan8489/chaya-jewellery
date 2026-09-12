import { ShieldAlert, Plus, MoreHorizontal } from "lucide-react";
import connectDB from "@/lib/db";
import { User } from "@/lib/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  await connectDB();
  const users = await User.find({ role: { $ne: "CUSTOMER" } }).sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-plum-950">
            Admin Users
          </h1>
          <p className="text-sm text-plum-600">
            Manage staff accounts and their access roles across the platform.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-gold-600 px-4 py-2 text-sm font-medium text-white hover:bg-gold-700">
          <Plus size={16} />
          Add Admin User
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ivory-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-plum-600">
            <thead className="bg-plum-50 text-xs font-semibold uppercase tracking-wider text-plum-900 border-b border-ivory-300">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {users.map((user: any) => (
                <tr
                  key={user._id.toString()}
                  className="transition-colors hover:bg-plum-50/50"
                >
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-plum-950">
                    {user.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'CONTENT_MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                     <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button className="rounded-md p-1.5 text-plum-400 hover:bg-plum-100 hover:text-plum-900 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-plum-500">
                    No admin users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
