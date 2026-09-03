import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { ServicesGrid } from "@/sections/services/ServicesGrid";
import type { ServiceDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function ServicesContent({ canEdit }: { canEdit: boolean }) {
  const res = await adminSessionJson<{ services: ServiceDTO[] }>("/services");
  const services = res.ok && Array.isArray(res.data.services) ? res.data.services : [];

  return <ServicesGrid initialServices={services} canEdit={canEdit} />;
}

export default async function ContentServicesPage() {
  const admin = await getAdminFromSession();
  const canEdit = Boolean(admin && (hasRole(admin.role, "ADMIN") || hasRole(admin.role, "SUPER_ADMIN")));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-3xl" />
              ))}
            </div>
          }
        >
          <ServicesContent canEdit={canEdit} />
        </Suspense>
      </div>
    </div>
  );
}
