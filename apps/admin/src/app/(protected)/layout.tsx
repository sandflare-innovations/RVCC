import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { AdminChrome } from "@/sections/layout/AdminChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!jar.get(ADMIN_COOKIE)?.value) redirect(ADMIN_LOGIN_EXPIRED_PATH);

  // Always validate the httpOnly session — profile cookie is display-only.
  const admin = await getAdminFromSession();
  if (!admin) redirect(ADMIN_LOGIN_EXPIRED_PATH);

  return <AdminChrome admin={admin}>{children}</AdminChrome>;
}
