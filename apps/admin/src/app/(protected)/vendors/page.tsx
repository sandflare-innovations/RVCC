import Link from "next/link";

import { StatusBadge } from "@repo/ui";

import { adminSessionJson } from "@/lib/admin-data";
import { CreateVendorForm } from "@/sections/CreateVendorForm";
import { VendorRowActions, type VendorSummary } from "@/sections/VendorRowActions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "RELEASED", label: "Access released" },
  { value: "HELD", label: "Access held" },
  { value: "PENDING", label: "Temporary password" },
  { value: "ALL", label: "All" },
] as const;

function formatDateTime(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type VendorRow = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  portalAccess: "HELD" | "RELEASED";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
  activeSessions: number;
  registrationId: string | null;
  companyName: string;
  referenceNumber: string | null;
  registrationStatus: string | null;
  registrationComplete: boolean;
  registration: {
    id: string;
    referenceNumber: string | null;
    status: string;
    company: { legalName: string } | null;
  } | null;
};

type Industry = { id: string; name: string };

export default async function VendorAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter, q } = await searchParams;
  const active = FILTERS.some((f) => f.value === filter) ? filter! : "RELEASED";
  const search = (q ?? "").trim();

  const qs = new URLSearchParams({ filter: active });
  if (search) qs.set("q", search);

  const [vendorsResult, industriesResult] = await Promise.all([
    adminSessionJson<VendorRow[]>(`/vendors?${qs}`),
    adminSessionJson<Industry[]>("/industries"),
  ]);

  const vendors = vendorsResult.ok ? vendorsResult.data : [];
  const industries = industriesResult.ok ? industriesResult.data : [];

  const toSummary = (v: VendorRow): VendorSummary => ({
    id: v.id,
    email: v.email,
    name: v.name ?? "",
    isActive: v.isActive,
    portalAccess: v.portalAccess === "RELEASED" ? "RELEASED" : "HELD",
    mustChangePassword: v.mustChangePassword,
    lastLoginAt: formatDateTime(v.lastLoginAt),
    createdAt: formatDate(v.createdAt),
    lockedUntil:
      v.lockedUntil && new Date(v.lockedUntil) > new Date()
        ? formatDateTime(v.lockedUntil)
        : null,
    activeSessions: v.activeSessions,
    registrationId: v.registrationId,
    companyName: v.companyName || "—",
    referenceNumber: v.referenceNumber,
    registrationStatus: v.registrationStatus,
    registrationComplete: v.registrationComplete,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Vendor Accounts</h1>
        <p className="mt-1 text-sm text-zinc-600">
          User Management — hold or release each supplier&apos;s portal access. Registration can be
          complete while access stays held.
        </p>
      </div>

      <CreateVendorForm industries={industries} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/vendors?filter=${f.value}`}
              className={
                f.value === active
                  ? "bg-brand-blue rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
              }
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form className="ml-auto" action="/vendors">
          <input type="hidden" name="filter" value={active} />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search email, name, company…"
            aria-label="Search vendor accounts"
            className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 w-72 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:ring-[3px]"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-xs font-semibold tracking-[0.08em] text-zinc-600 uppercase">
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {vendors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  {!vendorsResult.ok
                    ? `Could not load vendors (${vendorsResult.status}).`
                    : `No vendor accounts${search ? ` matching “${search}”` : ""} in this view.`}
                </td>
              </tr>
            )}
            {vendors.map((v) => (
              <tr key={v.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-950">{v.email}</p>
                  {v.name && <p className="text-xs text-zinc-500">{v.name}</p>}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {v.registration ? (
                    <>
                      <Link
                        href={`/registrations/${v.registration.id}`}
                        className="hover:text-brand-blue underline-offset-2 hover:underline"
                      >
                        {v.registration.company?.legalName || "—"}
                      </Link>
                      {v.registration.referenceNumber && (
                        <p className="font-mono text-xs text-zinc-500 tabular-nums">
                          {v.registration.referenceNumber}
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-zinc-500">Added by RVCC</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDateTime(v.lastLoginAt) ?? "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      status={v.portalAccess === "RELEASED" ? "ACTIVE" : "DISABLED"}
                    />
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 whitespace-nowrap">
                      {v.portalAccess === "RELEASED" ? "Released" : "Held"}
                    </span>
                    {v.registrationComplete && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 whitespace-nowrap">
                        Reg. complete
                      </span>
                    )}
                    {v.mustChangePassword && (
                      <span className="border-brand-blue text-brand-blue bg-brand-blue/5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                        Temp password
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <VendorRowActions vendor={toSummary(v)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
