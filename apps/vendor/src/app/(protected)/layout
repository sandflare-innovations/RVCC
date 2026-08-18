import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { VendorChrome } from "@/sections/VendorChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();

  if (!vendor) {
    // Redirect to the ?expired= form, which tells the proxy to drop the cookie.
    // A layout cannot clear it itself — Next only allows that in a Server Action
    // or Route Handler — and leaving it set makes the proxy bounce us back here
    // forever.
    redirect(VENDOR_LOGIN_EXPIRED_PATH);
  }

  if (vendor.mustChangePassword) {
    const pathname = (await headers()).get("x-pathname");
    // Only redirect when we know the path; missing header must not loop /password.
    if (pathname && pathname !== "/password") redirect("/password");
  }

  return <VendorChrome vendor={vendor}>{children}</VendorChrome>;
}
