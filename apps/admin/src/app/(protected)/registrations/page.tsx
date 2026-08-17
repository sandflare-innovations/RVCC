import Link from "next/link";

import { StatusBadge } from "@/lib/ui";

import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import {
  RegistrationRowActions,
  type RegistrationSummary,
} from "@/sections/RegistrationRowActions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "SUBMITTED", label: "Awaiting review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DRAFT", label: "In progress" },
  { value: "ALL", label: "All" },
] as const;

const VALID = new Set<string>(["SUBMITTED", "APPROVED", "REJECTED", "DRAFT", "ALL"]);

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ListRow = {
  id: string;
  email: string;
  status: string;
  referenceNumber: string | null;
  submittedAt: string | null;
  company: { legalName: string; country: string | null } | null;
};

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const active = status && VALID.has(status) ? status : "SUBMITTED";
  const search = (q ?? "").trim();

  const qs = new URLSearchParams({ status: active });
  if (search) qs.set("q", search);

  const [listResult, admin] = await Promise.all([
    adminSessionJson<ListRow[]>(`/registrations?${qs}`),
    getAdminFromSession(),
  ]);

  const registrations = listResult.ok ? listResult.data : [];
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  const toSummary = (r: ListRow): RegistrationSummary => ({
    id: r.id,
    email: r.email,
    status: r.status,
    referenceNumber: r.referenceNumber,
    companyName: r.company?.legalName ?? null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Vendor Registrations
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review and approve prospective supplier applications.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const on = f.value === active;
            return (
              <Link
                key={f.value}
                href={`/registrations?status=${f.value}`}
                className={
                  on
                    ? "bg-brand-blue rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <form className="ml-auto" action="/registrations">
          <input type="hidden" name="status" value={active} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search company, email, reference…"
            aria-label="Search registrations"
            className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 w-72 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:ring-[3px]"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-xs font-semibold tracking-[0.08em] text-zinc-600 uppercase">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact email</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {registrations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-600">
                  {!listResult.ok
                    ? `Could not load registrations (${listResult.status}).`
                    : `No registrations${search ? ` matching “${search}”` : ""} in this view.`}
                </td>
              </tr>
            )}
            {registrations.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/registrations/${r.id}`}
                    className="hover:text-brand-blue font-medium text-zinc-950 underline-offset-2 hover:underline"
                  >
                    {r.company?.legalName || <span className="text-zinc-500">Unnamed</span>}
                  </Link>
                  {r.company?.country ? (
                    <p className="text-xs text-zinc-500">{r.company.country}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-zinc-700">{r.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 tabular-nums">
                  {r.referenceNumber || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDate(r.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <RegistrationRowActions registration={toSummary(r)} canDelete={canDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {registrations.length === 100 && (
        <p className="text-xs text-zinc-500">
          Showing the first 100 results — narrow the search to see more.
        </p>
      )}
    </div>
  );
}
