import { cookies,headers } from "next/headers";
import { redirect } from "next/navigation";

import { VENDOR_COOKIE, VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { readVendorProfile } from "@/lib/profile-cookie";
import { getVendorFromSession } from "@/lib/session";
import { VendorChrome } from "@/sections/layout/VendorChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  if (!jar.get(VENDOR_COOKIE)?.value) redirect(VENDOR_LOGIN_EXPIRED_PATH);

  let vendor = await readVendorProfile();
  if (!vendor) {
    vendor = await getVendorFromSession();
    if (!vendor) redirect(VENDOR_LOGIN_EXPIRED_PATH);
  }

  if (vendor.mustChangePassword) {
    const pathname = (await headers()).get("x-pathname");
    if (pathname && pathname !== "/password") redirect("/password");
  }

  return <VendorChrome vendor={vendor}>{children}</VendorChrome>;
}
