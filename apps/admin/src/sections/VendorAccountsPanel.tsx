"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RefreshCw } from "lucide-react";

import { StatusBadge } from "@/lib/ui";
import { readVendorCache, writeVendorCache, type CachedVendorRow } from "@/lib/vendor-cache";
import {
  VENDOR_FILTERS,
  filterVendorRows,
  parseVendorFilter,
  parseVendorSearch,
  type VendorFilterValue,
} from "@/lib/vendor-filters";
import { CreateVendorForm, type IndustryOption } from "@/sections/CreateVendorForm";
import { VendorRowActions, type VendorSummary } from "@/sections/VendorRowActions";

type VendorRow = CachedVendorRow;

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
  const [allVendors, setAllVendors] = useState<VendorRow[]>(() => readVendorCache() ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(() => !readVendorCache());
  const [refreshing, setRefreshing] = useState(false);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const displayed = useMemo(
    () => filterVendorRows(allVendors, filter, search),
    [allVendors, filter, search]
  );

  const fetchAll = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    const background = opts?.background ?? false;

    if (!background) setRefreshing(true);
    if (!background && allVendors.length === 0) setInitialLoad(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/vendors", { credentials: "include" });
      const data = (await res.json().catch(() => null)) as VendorRow[] | { error?: string } | null;

      if (id !== requestId.current) return;

      if (!res.ok || !Array.isArray(data)) {
        if (allVendors.length === 0) {
          setLoadError(
            (data && typeof data === "object" && "error" in data && data.error) ||
              `Could not load vendors (${res.status}).`
          );
        }
        return;
      }

      setAllVendors(data);
      writeVendorCache(data);
    } catch {
      if (id !== requestId.current) return;
      if (allVendors.length === 0) setLoadError("Network error — please try again.");
    } finally {
      if (id === requestId.current) {
        setRefreshing(false);
        setInitialLoad(false);
      }
    }
  }, [allVendors.length]);

  useEffect(() => {
    const cached = readVendorCache();
    if (cached?.length) {
      setAllVendors(cached);
      setInitialLoad(false);
      void fetchAll({ background: true });
    } else {
      void fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const applyFilter = (next: VendorFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
      syncUrl(next, search);
    });
  };

  const onSearchChange = (value: string) => {
    const next = parseVendorSearch(value);
    setSearch(next);
    syncUrl(filter, next);
  };

  const refreshTable = () => {
    void fetchAll();
  };

  const updateRowInCache = useCallback(() => {
    void fetchAll({ background: true });
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Vendor Accounts</h1>
          <p className="mt-1 text-sm text-zinc-600">
            User Management — hold or release each supplier&apos;s portal access. Registration can
            be complete while access stays held.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshTable}
          disabled={refreshing}
          title="Refresh table data"
          aria-label="Refresh vendor table"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      <CreateVendorForm industries={industries} onCreated={updateRowInCache} />

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

        <div className="ml-auto">
          <input
            name="q"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search email, name, company…"
            aria-label="Search vendor accounts"
            maxLength={120}
            className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 w-72 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:ring-[3px]"
          />
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-lg border border-zinc-200 bg-white transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
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
            {initialLoad && displayed.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  Loading vendor accounts…
                </td>
              </tr>
            )}
            {loadError && displayed.length === 0 && !initialLoad && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  {loadError}
                </td>
              </tr>
            )}
            {!loadError && !initialLoad && displayed.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-600">
                  {`No vendor accounts${search ? ` matching “${search}”` : ""} in this view.`}
                </td>
              </tr>
            )}
            {displayed.map((v) => (
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
                  <VendorRowActions vendor={toSummary(v)} onUpdated={updateRowInCache} />
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
