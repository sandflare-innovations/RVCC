import { requireAdmin } from "@/lib/auth/admin-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="min-h-screen bg-neutral-50">{children}</div>;
}
