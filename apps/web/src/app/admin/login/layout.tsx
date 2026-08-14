import { redirect } from "next/navigation";

import { getAdminFromCookies } from "@/lib/auth/admin-guard";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromCookies();
  if (admin) redirect("/admin");
  return <>{children}</>;
}
