import { ChevronLeft, UserCheck } from "lucide-react";
import Link from "next/link";
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
      {/* Top Header */}
      <div className="flex flex-none items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
              <UserCheck className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">Clients</h1>
              <p className="text-sm text-zinc-500">
                Manage partner logos, sectors, and interactive 1:1 display order
              </p>
            </div>
          </div>
        </div>
      </div>

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
