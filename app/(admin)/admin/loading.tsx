import { AdminLoader } from "@/components/admin/ui/AdminLoader";

export default function AdminLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <AdminLoader size="lg" message="Loading admin dashboard..." />
    </div>
  );
}
