import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { StatusBadge } from "@/lib/ui";
import { CareerRowActions } from "@/sections/careers/CareerRowActions";

export const dynamic = "force-dynamic";

type JobRow = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  isRemote: boolean;
  isPublished: boolean;
};

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function CareersTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
      <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
        <thead>
          <tr className="bg-brand-blue text-white">
            <th className="rounded-l-2xl px-6 py-3.5 font-semibold">Title</th>
            <th className="px-6 py-3.5 font-semibold">Department</th>
            <th className="px-6 py-3.5 font-semibold">Location</th>
            <th className="px-6 py-3.5 font-semibold">State</th>
            <th className="rounded-r-2xl px-6 py-3.5 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="rounded-2xl bg-white ring-1 ring-zinc-100 ring-inset">
              <td className="rounded-l-2xl px-6 py-4">
                <Skeleton className="mb-1 h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-6 py-4">
                <Skeleton className="h-5 w-20 rounded-full" />
              </td>
              <td className="rounded-r-2xl px-6 py-4">
                <Skeleton className="h-8 w-16 rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data component (streamed via Suspense)                       */
/* ------------------------------------------------------------------ */

async function CareersData() {
  const [jobsResult, admin] = await Promise.all([
    adminSessionJson<JobRow[]>("/careers"),
    getAdminFromSession(),
  ]);
  const jobs = jobsResult.ok ? jobsResult.data : [];
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="flex min-h-0 w-full flex-col rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
      {/* Fixed Top Header */}
      <div className="bg-brand-blue mb-2 shrink-0 rounded-2xl px-6 py-3.5 text-white shadow-xs">
        <div className="grid grid-cols-12 items-center gap-3 text-xs font-semibold">
          <div className="col-span-4 min-w-0">Title</div>
          <div className="col-span-3 min-w-0">Department</div>
          <div className="col-span-2 min-w-0">Location</div>
          <div className="col-span-2 min-w-0">State</div>
          <div className="col-span-1 min-w-0 text-right">Actions</div>
        </div>
      </div>

      {/* Scrollable Rows */}
      <div
        data-lenis-prevent
        className="min-h-0 [scrollbar-width:none] space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {jobs.length === 0 && (
          <div className="px-6 py-10 text-center text-zinc-600">
            {!jobsResult.ok ? `Could not load careers (${jobsResult.status}).` : "No postings yet."}
          </div>
        )}
        {jobs.map((j) => (
          <div
            key={j.id}
            className="hover:ring-brand-blue/40 group grid grid-cols-12 items-center gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-zinc-100 transition-all ring-inset hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)]"
          >
            <div className="col-span-4 min-w-0">
              <Link
                href={`/content/careers/${j.id}`}
                className="hover:text-brand-blue block truncate font-medium text-zinc-950 underline-offset-2 hover:underline"
              >
                {j.title}
              </Link>
              <p className="truncate font-mono text-xs text-zinc-500">/{j.slug}</p>
            </div>
            <div className="col-span-3 min-w-0 truncate text-zinc-700">{j.department || "—"}</div>
            <div className="col-span-2 min-w-0 truncate text-zinc-700">
              {j.location || "—"}
              {j.isRemote && <span className="text-brand-blue text-xs"> · Remote</span>}
            </div>
            <div className="col-span-2 min-w-0 truncate">
              <StatusBadge status={j.isPublished ? "PUBLISHED" : "DRAFT_CONTENT"} />
            </div>
            <div className="col-span-1 min-w-0 text-right">
              <CareerRowActions
                job={{ id: j.id, title: j.title, slug: j.slug, isPublished: j.isPublished }}
                canDelete={canDelete}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function CareersAdminPage() {
  return (
    <div className="space-y-6">
      {/* Static header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/content" className="hover:text-brand-blue text-sm text-zinc-600">
            ← Site Content
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Careers</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Drafts stay hidden until published. Changes appear on the public page immediately.
          </p>
        </div>
        <Link
          href="/content/careers/new"
          className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New posting
        </Link>
      </div>

      {/* ---- Streamed Table ---- */}
      <Suspense fallback={<CareersTableSkeleton />}>
        <CareersData />
      </Suspense>
    </div>
  );
}
