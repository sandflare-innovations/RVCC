import { Suspense } from "react";

import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { RegistrationsPanel, RegistrationsSkeleton } from "@/sections/registrations/RegistrationsPanel";

/** Shell is static; registration rows load client-side for instant filter switching. */
export default async function RegistrationsPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <Suspense fallback={<RegistrationsSkeleton />}>
      <RegistrationsPanel canDelete={canDelete} />
    </Suspense>
  );
}
