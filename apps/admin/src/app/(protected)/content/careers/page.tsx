import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { CareerJobItem,CareersPanel } from "@/sections/careers/CareersPanel";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Skeleton Fallback matching modern KPI + Cards Layout               */
/* ------------------------------------------------------------------ */

function CareersSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-3.5 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="mb-6 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex h-24 flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-2xl" />
            </div>
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-[42px] w-full max-w-sm rounded-full" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-[42px] w-40 rounded-full" />
          <Skeleton className="h-[42px] w-48 rounded-full" />
          <Skeleton className="h-[42px] w-28 rounded-full" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-200/80 bg-white p-5 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-5 w-4/5 rounded-md" />
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
              </div>
              <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                <Skeleton className="h-4 w-20 rounded-md" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function CareersData() {
  const [jobsResult, admin] = await Promise.all([
    adminSessionJson<CareerJobItem[]>("/careers"),
    getAdminFromSession(),
  ]);

  const jobs = jobsResult.ok ? jobsResult.data : [];
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return <CareersPanel initialJobs={jobs} canDelete={canDelete} />;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function CareersAdminPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <Suspense fallback={<CareersSkeleton />}>
        <CareersData />
      </Suspense>
    </div>
  );
}
