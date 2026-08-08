import AdminShell from "@/components/admin/AdminShell";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
