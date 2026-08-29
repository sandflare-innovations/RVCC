import { Suspense } from "react";
import Link from "next/link";

import { Plus } from "lucide-react";

import { StatusBadge } from "@/lib/ui";
import { Skeleton } from "@/components/ui/skeleton";

import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
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
      <table className="w-full text-left text-sm border-separate border-spacing-y-2">
        <thead>
          <tr className="bg-brand-blue text-white">
            <th className="px-6 py-3.5 font-semibold rounded-l-2xl">Title</th>
            <th className="px-6 py-3.5 font-semibold">Department</th>
            <th className="px-6 py-3.5 font-semibold">Location</th>
            <th className="px-6 py-3.5 font-semibold">State</th>
            <th className="px-6 py-3.5 font-semibold text-right rounded-r-2xl">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl">
              <td className="px-6 py-4 rounded-l-2xl">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </td>
              <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
              <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
              <td className="px-6 py-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
              <td className="px-6 py-4 rounded-r-2xl"><Skeleton className="h-8 w-16 rounded-lg" /></td>
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
    <div className="flex flex-col min-h-0 w-full rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
      {/* Fixed Top Header */}
      <div className="shrink-0 bg-brand-blue text-white rounded-2xl px-6 py-3.5 shadow-xs mb-2">
        <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold">
          <div className="col-span-4 min-w-0">Title</div>
          <div className="col-span-3 min-w-0">Department</div>
          <div className="col-span-2 min-w-0">Location</div>
          <div className="col-span-2 min-w-0">State</div>
          <div className="col-span-1 min-w-0 text-right">Actions</div>
        </div>
      </div>

      {/* Scrollable Rows */}
      <div data-lenis-prevent className="min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-2 pr-1">
        {jobs.length === 0 && (
          <div className="px-6 py-10 text-center text-zinc-600">
            {!jobsResult.ok
              ? `Could not load careers (${jobsResult.status}).`
              : "No postings yet."}
          </div>
        )}
        {jobs.map((j) => (
          <div
            key={j.id}
            className="grid grid-cols-12 gap-3 items-center bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl p-4 transition-all hover:ring-brand-blue/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] text-sm group"
          >
            <div className="col-span-4 min-w-0">
              <Link
                href={`/content/careers/${j.id}`}
                className="hover:text-brand-blue font-medium text-zinc-950 underline-offset-2 hover:underline truncate block"
              >
                {j.title}
              </Link>
              <p className="font-mono text-xs text-zinc-500 truncate">/{j.slug}</p>
            </div>
            <div className="col-span-3 min-w-0 text-zinc-700 truncate">{j.department || "—"}</div>
            <div className="col-span-2 min-w-0 text-zinc-700 truncate">
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
