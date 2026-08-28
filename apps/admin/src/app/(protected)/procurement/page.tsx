import { Suspense } from "react";
import type { Metadata } from "next";
import { ProcurementPanel, ProcurementSkeleton } from "@/sections/ProcurementPanel";

export const metadata: Metadata = {
  title: "Procurement Requisitions | RVCC Admin",
};

export default function ProcurementPage() {
  return (
    <Suspense fallback={<ProcurementSkeleton />}>
      <ProcurementPanel />
    </Suspense>
  );
}
