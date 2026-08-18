import { redirect } from "next/navigation";

import { ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { AdminChrome } from "@/sections/AdminChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromSession();
  // The ?expired= form tells the proxy to drop the cookie. A layout cannot clear
  // it itself — Next only allows that in a Server Action or Route Handler — and
  // leaving it set makes the proxy bounce us back here forever.
  if (!admin) redirect(ADMIN_LOGIN_EXPIRED_PATH);

  return <AdminChrome admin={admin}>{children}</AdminChrome>;
}
