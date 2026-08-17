import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PortalShell } from "@/components/layout/PortalShell";
import { VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { VendorChrome } from "@/sections/VendorChrome";

export { metadata } from "@/components/layout/PortalShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();

  if (!vendor) {
    redirect(VENDOR_LOGIN_EXPIRED_PATH);
  }

  if (!vendor.registrationComplete) {
    redirect("/register/verify");
  }

  if (vendor.portalAccess !== "RELEASED") {
    redirect("/access-held");
  }

  if (vendor.mustChangePassword) {
    const pathname = (await headers()).get("x-pathname");
    if (pathname && pathname !== "/portal/password") redirect("/portal/password");
  }

  return (
    <PortalShell>
      <VendorChrome vendor={vendor}>{children}</VendorChrome>
    </PortalShell>
  );
}
