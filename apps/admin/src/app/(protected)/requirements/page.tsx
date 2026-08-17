import Link from "next/link";

import { parsePage } from "@repo/rfq";
import { Pagination } from "@repo/ui";

import { adminSessionJson } from "@/lib/admin-data";
import { CreateRequirementForm, type ParticipantOption } from "@/sections/CreateRequirementForm";

export const dynamic = "force-dynamic";

type PageEnvelope<T> = {
  items: T[];
  total: number;
  page: number;
  pages: number;
};

type RequirementRow = {
  id: string;
  referenceNumber: string | null;
  project: string;
  closesAt: string;
  status: string;
  invited: number;
  submitted: number;
};

type VendorOption = {
  id: string;
  email: string;
  name: string | null;
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string, closesAt: string) {
  if (status === "OPEN" && new Date(closesAt).getTime() <= Date.now()) return "Closed";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);

  const [reqResult, vendorsResult] = await Promise.all([
    adminSessionJson<PageEnvelope<RequirementRow>>(`/requirements?page=${page}`),
    adminSessionJson<VendorOption[]>("/vendors?filter=ACTIVE"),
  ]);

  const requirements = reqResult.ok ? reqResult.data.items : [];
  const total = reqResult.ok ? reqResult.data.total : 0;
  const pages = reqResult.ok ? reqResult.data.pages : 1;
  const vendors = vendorsResult.ok ? vendorsResult.data : [];

  const toOption = (p: VendorOption): ParticipantOption => ({
    id: p.id,
    label: p.name ? `${p.name} (${p.email})` : p.email,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Requirements</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Work put out to quote. Each invited supplier submits a price without seeing anyone
          else&apos;s.
        </p>
      </div>

      <CreateRequirementForm vendors={vendors.map(toOption)} />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
            <tr>
              <th className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Closes</th>
              <th className="px-4 py-3 font-semibold">Invited</th>
              <th className="px-4 py-3 font-semibold">Quotes</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {requirements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  {!reqResult.ok
                    ? `Could not load requirements (${reqResult.status}).`
                    : "Nothing posted yet."}
                </td>
              </tr>
            ) : (
              requirements.map((r) => (
                <tr key={r.id} className="group transition-colors hover:bg-zinc-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 transition-colors group-hover:bg-zinc-50">
                    <Link
                      href={`/requirements/${r.id}`}
                      className="hover:text-brand-blue font-mono text-xs tabular-nums underline-offset-2 hover:underline"
                    >
                      {r.referenceNumber ?? "— draft —"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-950">{r.project}</td>
                  <td className="px-4 py-3 text-zinc-600 tabular-nums">
                    {formatDateTime(r.closesAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{r.invited}</td>
                  <td className="px-4 py-3 text-zinc-700 tabular-nums">{r.submitted}</td>
                  <td className="px-4 py-3 text-zinc-700">{statusLabel(r.status, r.closesAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/requirements/${r.id}`}
                      className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        noun="requirements"
        href={(n) => `/requirements?page=${n}`}
      />
    </div>
  );
}
