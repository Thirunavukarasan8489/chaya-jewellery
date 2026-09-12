import CustomAdminLayout from '@/components/admin/layout/AdminLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomAdminLayout>
      {children}
    </CustomAdminLayout>
  );
}
