import { redirect } from "next/navigation";

import { PortalShell } from "@/components/layout/PortalShell";
import { getVendorFromSession } from "@/lib/session";
import { EnquireProvider } from "@/sections/enquire/EnquireContext";

export { metadata } from "@/components/layout/PortalShell";

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();
  if (vendor) {
    redirect(vendor.mustChangePassword ? "/change-password" : "/");
  }

  return (
    <PortalShell>
      <EnquireProvider>{children}</EnquireProvider>
    </PortalShell>
  );
}
