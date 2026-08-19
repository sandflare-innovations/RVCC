import { redirect } from "next/navigation";

import { cookies } from "next/headers";

import { ADMIN_COOKIE, ADMIN_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { readAdminProfile } from "@/lib/profile-cookie";
import { getAdminFromSession } from "@/lib/session";
import { AdminChrome } from "@/sections/AdminChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!jar.get(ADMIN_COOKIE)?.value) redirect(ADMIN_LOGIN_EXPIRED_PATH);

  // Chrome display from profile cookie — avoids /auth/me on every navigation.
  let admin = await readAdminProfile();
  if (!admin) {
    admin = await getAdminFromSession();
    if (!admin) redirect(ADMIN_LOGIN_EXPIRED_PATH);
  }

  return <AdminChrome admin={admin}>{children}</AdminChrome>;
}
