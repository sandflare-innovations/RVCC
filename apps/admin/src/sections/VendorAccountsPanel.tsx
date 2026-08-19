"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { StatusBadge } from "@/lib/ui";
import {
  VENDOR_FILTERS,
  parseVendorFilter,
  parseVendorSearch,
  type VendorFilterValue,
} from "@/lib/vendor-filters";
import { CreateVendorForm, type IndustryOption } from "@/sections/CreateVendorForm";
import { VendorRowActions, type VendorSummary } from "@/sections/VendorRowActions";

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

function formatDateTime(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toSummary(v: VendorRow): VendorSummary {
  return {
    id: v.id,
    email: v.email,
    name: v.name ?? "",
    isActive: v.isActive,
    portalAccess: v.portalAccess === "RELEASED" ? "RELEASED" : "HELD",
    mustChangePassword: v.mustChangePassword,
    lastLoginAt: formatDateTime(v.lastLoginAt),
    createdAt: formatDate(v.createdAt),
    lockedUntil:
      v.lockedUntil && new Date(v.lockedUntil) > new Date() ? formatDateTime(v.lockedUntil) : null,
    activeSessions: v.activeSessions,
    registrationId: v.registrationId,
    companyName: v.companyName || "—",
    referenceNumber: v.referenceNumber,
    registrationStatus: v.registrationStatus,
    registrationComplete: v.registrationComplete,
  };
}

function syncUrl(filter: VendorFilterValue, search: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("filter", filter);
  if (search) url.searchParams.set("q", search);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

export function VendorAccountsPanel({ industries }: { industries: IndustryOption[] }) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<VendorFilterValue>(() =>
    parseVendorFilter(searchParams.get("filter"))
  );
  const [search, setSearch] = useState(() => parseVendorSearch(searchParams.get("q")));
  const [draftSearch, setDraftSearch] = useState(search);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const loadVendors = useCallback(async (nextFilter: VendorFilterValue, nextSearch: string) => {
    const id = ++requestId.current;
    setFetching(true);
    setLoadError(null);

    const qs = new URLSearchParams({ filter: nextFilter });
    if (nextSearch) qs.set("q", nextSearch);

    try {
      const res = await fetch(`/api/vendors?${qs}`, { credentials: "include" });
      const data = (await res.json().catch(() => null)) as VendorRow[] | { error?: string } | null;

      if (id !== requestId.current) return;

      if (!res.ok || !Array.isArray(data)) {
        setLoadError(
          (data && typeof data === "object" && "error" in data && data.error) ||
            `Could not load vendors (${res.status}).`
        );
        return;
      }

      setVendors(data);
    } catch {
      if (id !== requestId.current) return;
      setLoadError("Network error — please try again.");
    } finally {
      if (id === requestId.current) setFetching(false);
    }
  }, []);

  useEffect(() => {
    void loadVendors(filter, search);
  }, [filter, search, loadVendors]);

  const applyFilter = (next: VendorFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
      syncUrl(next, search);
    });
  };

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = parseVendorSearch(draftSearch);
    setSearch(next);
    syncUrl(filter, next);
  };

  const refreshList = useCallback(() => {
    void loadVendors(filter, search);
  }, [filter, search, loadVendors]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Vendor Accounts</h1>
        <p className="mt-1 text-sm text-zinc-600">
          User Management — hold or release each supplier&apos;s portal access. Registration can be
          complete while access stays held.
        </p>
      </div>

      <CreateVendorForm industries={industries} onCreated={refreshList} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Vendor access filters">
          {VENDOR_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={f.value === filter}
              onClick={() => applyFilter(f.value)}
              className={
                f.value === filter
                  ? "bg-brand-blue rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <form className="ml-auto flex items-center gap-2" onSubmit={applySearch}>
          <input
            name="q"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder="Search email, name, company…"
            aria-label="Search vendor accounts"
            maxLength={120}
            className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 w-72 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:ring-[3px]"
          />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
          >
            Search
          </button>
        </form>
      </div>

      <div
        className={`overflow-hidden rounded-lg border border-zinc-200 bg-white transition-opacity duration-150 ${fetching ? "opacity-60" : "opacity-100"}`}
        aria-busy={fetching}
      >
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
            {loadError && vendors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  {loadError}
                </td>
              </tr>
            )}
            {!loadError && vendors.length === 0 && !fetching && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  {`No vendor accounts${search ? ` matching “${search}”` : ""} in this view.`}
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
                    <StatusBadge status={v.portalAccess === "RELEASED" ? "ACTIVE" : "DISABLED"} />
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-zinc-700">
                      {v.portalAccess === "RELEASED" ? "Released" : "Held"}
                    </span>
                    {v.registrationComplete && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-emerald-800">
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
                  <VendorRowActions vendor={toSummary(v)} onUpdated={refreshList} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VendorAccountsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-zinc-200" />
        <div className="h-4 w-full max-w-xl rounded bg-zinc-100" />
      </div>
      <div className="h-10 w-40 rounded bg-zinc-100" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded bg-zinc-100" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-zinc-200 bg-white" />
    </div>
  );
}
