import Link from "next/link";

import { Plus } from "lucide-react";

import { getAdminFromSession, hasRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { CareerRowActions } from "@/sections/admin/CareerRowActions";
import { StatusBadge } from "@/sections/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CareersAdminPage() {
  const [jobs, admin] = await Promise.all([
    prisma.jobPosting.findMany({ orderBy: [{ sortOrder: "asc" }, { postedAt: "desc" }] }),
    getAdminFromSession(),
  ]);
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/content" className="hover:text-brand-blue text-sm text-zinc-600">
            ← Site Content
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Careers</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Drafts stay hidden until published. Changes appear on the public page immediately.
          </p>
        </div>
        <Link
          href="/admin/content/careers/new"
          className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New posting
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-xs font-semibold tracking-[0.08em] text-zinc-600 uppercase">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  No postings yet.
                </td>
              </tr>
            )}
            {jobs.map((j) => (
              <tr key={j.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/content/careers/${j.id}`}
                    className="hover:text-brand-blue font-medium text-zinc-950 underline-offset-2 hover:underline"
                  >
                    {j.title}
                  </Link>
                  <p className="font-mono text-xs text-zinc-500">/{j.slug}</p>
                </td>
                <td className="px-4 py-3 text-zinc-700">{j.department || "—"}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {j.location || "—"}
                  {j.isRemote && <span className="text-brand-blue text-xs"> · Remote</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={j.isPublished ? "PUBLISHED" : "DRAFT_CONTENT"} />
                </td>
                <td className="px-4 py-3">
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
    </div>
  );
}
