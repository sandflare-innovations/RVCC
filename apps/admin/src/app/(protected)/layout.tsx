import { redirect } from "next/navigation";

import { ADMIN_LOGIN_PATH } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { AdminChrome } from "@/sections/AdminChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromSession();
  if (!admin) redirect(ADMIN_LOGIN_PATH);

  return <AdminChrome admin={admin}>{children}</AdminChrome>;
}
