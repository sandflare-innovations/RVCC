import { Suspense } from "react";

import { getAdminIndustries } from "@/lib/admin-cache";
import {
  VendorAccountsPanel,
  VendorAccountsSkeleton,
} from "@/sections/vendors/VendorAccountsPanel";

/** Shell is static; vendor rows load client-side for instant filter switching. */
export default async function VendorAccountsPage() {
  const industries = await getAdminIndustries();

  return (
    <Suspense fallback={<VendorAccountsSkeleton />}>
      <VendorAccountsPanel industries={industries} />
    </Suspense>
  );
}
