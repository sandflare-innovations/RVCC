import { Suspense } from "react";

import Link from "next/link";

import { SkeletonCard, SkeletonRow } from "@repo/ui";

import { DashboardActivity } from "@/sections/DashboardActivity";
import { DashboardKpis } from "@/sections/DashboardKpis";
import { DashboardQueue } from "@/sections/DashboardQueue";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Sourcing activity and vendor registrations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/requirements"
            className="bg-brand-blue focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Create requirement
          </Link>
          <Link
            href="/vendors"
            className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none"
          >
            Add vendor
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
        <DashboardKpis />
      </Suspense>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
          Priority work
        </h2>
        <Suspense
          fallback={
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ))}
            </div>
          }
        >
          <DashboardQueue />
        </Suspense>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-[0.12em] text-zinc-600 uppercase">
            Recent activity
          </h2>
          <Link
            href="/vendors/performance"
            className="text-brand-blue text-sm font-semibold underline-offset-2 hover:underline"
          >
            Supplier performance
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="rounded-lg border border-zinc-200 bg-white">
              {Array.from({ length: 5 }, (_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          }
        >
          <DashboardActivity />
        </Suspense>
      </section>
    </div>
  );
}
