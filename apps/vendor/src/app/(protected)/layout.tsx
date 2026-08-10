import { redirect } from "next/navigation";

import { VENDOR_LOGIN_PATH } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { VendorChrome } from "@/sections/VendorChrome";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect(VENDOR_LOGIN_PATH);

  return <VendorChrome vendor={vendor}>{children}</VendorChrome>;
}
