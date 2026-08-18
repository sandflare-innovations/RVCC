import { redirect } from "next/navigation";

import { PortalShell } from "@/components/layout/PortalShell";
import { getVendorFromSession } from "@/lib/session";
import { EnquireProvider } from "@/sections/enquire/EnquireContext";

export { metadata } from "@/components/layout/PortalShell";

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const vendor = await getVendorFromSession();
  if (vendor) {
    if (!vendor.registrationComplete) {
      // Incomplete account with a session should stay in the wizard.
    } else if (vendor.portalAccess !== "RELEASED") {
      redirect("/access-held");
    } else {
      redirect(vendor.mustChangePassword ? "/portal/password" : "/portal");
    }
  }

  return (
    <PortalShell>
      <EnquireProvider>{children}</EnquireProvider>
    </PortalShell>
  );
}
