import { Suspense } from "react";
import Link from "next/link";

import { Plus } from "lucide-react";

import { StatusBadge } from "@/lib/ui";
import { Skeleton } from "@/components/ui/skeleton";

import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { CareerRowActions } from "@/sections/CareerRowActions";

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
          {jobs.length === 0 && (
            <tr className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl">
              <td colSpan={5} className="px-6 py-10 text-center text-zinc-600 rounded-2xl">
                {!jobsResult.ok
                  ? `Could not load careers (${jobsResult.status}).`
                  : "No postings yet."}
              </td>
            </tr>
          )}
          {jobs.map((j) => (
            <tr key={j.id} className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl transition-all hover:ring-brand-blue/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] group">
              <td className="px-6 py-4 rounded-l-2xl">
                <Link
                  href={`/content/careers/${j.id}`}
                  className="hover:text-brand-blue font-medium text-zinc-950 underline-offset-2 hover:underline"
                >
                  {j.title}
                </Link>
                <p className="font-mono text-xs text-zinc-500">/{j.slug}</p>
              </td>
              <td className="px-6 py-4 text-zinc-700">{j.department || "—"}</td>
              <td className="px-6 py-4 text-zinc-700">
                {j.location || "—"}
                {j.isRemote && <span className="text-brand-blue text-xs"> · Remote</span>}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={j.isPublished ? "PUBLISHED" : "DRAFT_CONTENT"} />
              </td>
              <td className="px-6 py-4 rounded-r-2xl">
                <CareerRowActions
                  job={{ id: j.id, title: j.title, slug: j.slug, isPublished: j.isPublished }}
                  canDelete={canDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
