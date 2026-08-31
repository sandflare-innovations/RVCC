import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminProcurementDetailView } from "@/sections/procurement/AdminProcurementDetailView";

export const metadata: Metadata = {
  title: "Requisition Details | RVCC Admin",
};

export default function ProcurementDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-zinc-500">Loading requisition details...</div>
      }
    >
      <AdminProcurementDetailView />
    </Suspense>
  );
}
