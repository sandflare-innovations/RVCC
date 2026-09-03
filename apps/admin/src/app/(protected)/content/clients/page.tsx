import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { ClientsGrid } from "@/sections/clients/ClientsGrid";
import type { ClientPartnerDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function ClientsContent({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ clients: ClientPartnerDTO[] }>("/clients");
  const clients = res.ok && Array.isArray(res.data.clients) ? res.data.clients : [];

  return <ClientsGrid initialClients={clients} canDelete={canDelete} />;
}

export default async function ContentClientsPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Grid Content with Suspense */}
      <div className="flex-1 overflow-y-auto pb-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-3xl bg-zinc-100 animate-pulse p-4" />
              ))}
            </div>
          }
        >
          <ClientsContent canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}
