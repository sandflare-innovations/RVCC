import { Suspense } from "react";

import { RequirementsPanel, RequirementsSkeleton } from "@/sections/requirements/RequirementsPanel";

/** Shell is static; requirement rows load client-side with session cache + refresh. */
export default function RequirementsPage() {
  return (
    <Suspense fallback={<RequirementsSkeleton />}>
      <RequirementsPanel />
    </Suspense>
  );
}
