import Link from "next/link";

import { StatusBadge } from "@repo/ui";

import { prisma } from "@/lib/db";
import { CreateVendorForm } from "@/sections/CreateVendorForm";
import { VendorRowActions, type VendorSummary } from "@/sections/VendorRowActions";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISABLED", label: "Disabled" },
  { value: "PENDING", label: "Temporary password" },
  { value: "ALL", label: "All" },
] as const;

function formatDateTime(d: Date | null) {
  if (!d) return null;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function VendorAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter, q } = await searchParams;
  const active = FILTERS.some((f) => f.value === filter) ? filter! : "ACTIVE";
  const search = (q ?? "").trim();

  const where = {
    ...(active === "ACTIVE" ? { isActive: true } : {}),
    ...(active === "DISABLED" ? { isActive: false } : {}),
    ...(active === "PENDING" ? { mustChangePassword: true } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            {
              registration: {
                company: { legalName: { contains: search, mode: "insensitive" as const } },
              },
            },
          ],
        }
      : {}),
  };

  // Fetched alongside the list rather than in the form, which is a client
  // component and cannot query Prisma.
  const industries = await prisma.industry.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const vendors = await prisma.vendorUser.findMany({
    where,
    include: {
      registration: {
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          company: { select: { legalName: true } },
        },
      },
      _count: {
        select: { sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } } },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  const toSummary = (v: (typeof vendors)[number]): VendorSummary => ({
    id: v.id,
    email: v.email,
    name: v.name,
    isActive: v.isActive,
    mustChangePassword: v.mustChangePassword,
    lastLoginAt: formatDateTime(v.lastLoginAt),
    createdAt: formatDate(v.createdAt),
    lockedUntil: v.lockedUntil && v.lockedUntil > new Date() ? formatDateTime(v.lockedUntil) : null,
    activeSessions: v._count.sessions,
    // registration is null for admin-created vendors, who never registered.
    registrationId: v.registration?.id ?? null,
    companyName: v.registration?.company?.legalName || "—",
    referenceNumber: v.registration?.referenceNumber ?? null,
    registrationStatus: v.registration?.status ?? null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Vendor Accounts</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Portal logins issued when a registration is approved, plus accounts added directly by
          RVCC.
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
                  No vendor accounts{search ? ` matching “${search}”` : ""} in this view. Accounts
                  are created when a registration is approved.
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
                    // Created directly by an admin — there is no registration to link to.
                    <span className="text-zinc-500">Added by RVCC</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDateTime(v.lastLoginAt) ?? "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={v.isActive ? "ACTIVE" : "DISABLED"} />
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
