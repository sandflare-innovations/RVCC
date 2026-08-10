import { redirect } from "next/navigation";

import { ADMIN_LOGIN_PATH } from "@/lib/admin/constants";
import { getAdminFromSession } from "@/lib/admin/session";
import { AdminChrome } from "@/sections/admin/AdminChrome";

/**
 * The authoritative auth gate. Middleware only checks that a cookie is present;
 * this verifies the session against the database on every request, so a
 * revoked, expired, or deactivated account is rejected even with a valid cookie.
 *
 * /admin/login deliberately lives outside this route group.
 */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminFromSession();
  if (!admin) redirect(ADMIN_LOGIN_PATH);

  return <AdminChrome admin={admin}>{children}</AdminChrome>;
}
