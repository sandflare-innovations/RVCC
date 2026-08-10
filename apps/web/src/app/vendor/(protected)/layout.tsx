import { redirect } from "next/navigation";

import { getVendorFromSession } from "@/lib/vendor/session";
import { VendorChrome } from "@/sections/vendor/VendorChrome";

/**
 * Authoritative vendor gate. Middleware only sees the cookie; this validates
 * the session against the database on every request.
 */
export default async function ProtectedVendorLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect("/vendor/login");

  return <VendorChrome vendor={vendor}>{children}</VendorChrome>;
}
