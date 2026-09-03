import { notFound } from "next/navigation";

import { adminSessionJson } from "@/lib/admin-data";
import { ServiceDetailView } from "@/sections/services/ServiceDetailView";
import type { ServiceDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

export default async function EditServicePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const res = await adminSessionJson<{ service?: ServiceDTO } & Partial<ServiceDTO>>(
    `/services/${encodeURIComponent(id)}`
  );

  const service =
    res.ok && (res.data.service || (res.data.id && res.data))
      ? ((res.data.service || res.data) as ServiceDTO)
      : null;

  if (!service) {
    notFound();
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12">
        <ServiceDetailView initialService={service} />
      </div>
    </div>
  );
}
