import { cookies } from "next/headers";
import { Suspense } from "react";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";
import {
  type RequirementRow,
  VendorRequirementsWorkbench,
} from "@/sections/requirements/VendorRequirementsWorkbench";

export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  let rows: RequirementRow[] = [];
  try {
    const res = await vendorWorkerFetch("/requirements", { method: "GET", sessionToken: token });
    if (res.ok) {
      const data = await res.json();
      rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.requirements)
          ? data.requirements
          : [];
    }
  } catch (err) {
    console.error("[vendor] requirements list failed", err);
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="border-brand-blue h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <VendorRequirementsWorkbench initialRows={rows} />
    </Suspense>
  );
}

