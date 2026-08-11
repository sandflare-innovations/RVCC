import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { VENDOR_LOGIN_PATH } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { VendorChrome } from "@/sections/VendorChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect(VENDOR_LOGIN_PATH);

  if (vendor.mustChangePassword) {
    const pathname = (await headers()).get("x-pathname");
    // Only redirect when we know the path; missing header must not loop /password.
    if (pathname && pathname !== "/password") redirect("/password");
  }

  return <VendorChrome vendor={vendor}>{children}</VendorChrome>;
}
