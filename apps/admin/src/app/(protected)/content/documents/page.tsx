import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { DocumentsManager } from "@/sections/documents/DocumentsManager";
import type { CompanyDocumentDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function DocumentsContent({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ ok: boolean; documents: CompanyDocumentDTO[] }>(
    "/documents"
  );
  const documents = res.ok && Array.isArray(res.data?.documents) ? res.data.documents : [];

  return <DocumentsManager initialDocuments={documents} canDelete={canDelete} />;
}

export default async function ContentDocumentsPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-12">
        <Suspense
          fallback={
            <div className="p-8 max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-12 w-64 rounded-2xl" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                <Skeleton className="h-72 rounded-none" />
                <Skeleton className="h-72 rounded-none" />
              </div>
            </div>
          }
        >
          <DocumentsContent canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}

