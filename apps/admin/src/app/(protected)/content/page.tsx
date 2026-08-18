import Link from "next/link";

import { Briefcase, FileText, ImageIcon, Users } from "lucide-react";

import { adminSessionJson } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

type DashboardJobs = { publishedJobs: number; totalJobs: number };

export default async function ContentHubPage() {
  const result = await adminSessionJson<DashboardJobs>("/dashboard");
  const published = result.ok ? (result.data.publishedJobs ?? 0) : 0;
  const total = result.ok ? (result.data.totalJobs ?? published) : 0;

  const pending = [
    { label: "Project Gallery", icon: ImageIcon, detail: "16 projects · needs image uploads" },
    { label: "Clients", icon: Users, detail: "18 logos · needs image uploads" },
    { label: "Documents", icon: FileText, detail: "PDFs · served from R2" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Site Content</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Content that can be edited without a developer or a redeploy.
        </p>
      </div>

      <Link
        href="/content/careers"
        className="hover:border-brand-blue block rounded-lg border border-zinc-200 bg-white p-5 transition-colors"
      >
        <div className="flex items-start gap-4">
          <span className="bg-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-950">Careers</p>
            <p className="mt-0.5 text-sm text-zinc-600">
              Job postings shown on the public careers page.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-zinc-950 tabular-nums">{published}</p>
            <p className="text-xs text-zinc-500">
              published{total !== published ? ` · ${total - published} draft` : ""}
            </p>
          </div>
        </div>
      </Link>

      <section>
        <h2 className="mb-3 text-xs font-bold tracking-[0.12em] text-zinc-600 uppercase">
          Not editable yet
        </h2>
        <ul className="space-y-2">
          {pending.map(({ label, icon: Icon, detail }) => (
            <li
              key={label}
              className="flex items-center gap-4 rounded-lg border border-dashed border-zinc-300 bg-white px-5 py-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-700">{label}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-zinc-600">
          These need object storage before they can be edited here — a deployed app cannot write
          into its own <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">public/</code>{" "}
          folder. Cloudflare R2 is the natural fit alongside the existing API.
        </p>
      </section>
    </div>
  );
}
