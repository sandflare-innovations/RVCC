"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { RefreshCw, Search, ChevronDown, Users, CheckCircle, Lock, ShieldAlert, Clock } from "lucide-react";

import { StatusBadge, AnimatedSearchInput } from "@/lib/ui";
import { fetchTableJson } from "@/lib/table-fetch";
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
import { SmoothScroll } from "@/components/ui";

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

const SEARCH_PLACEHOLDERS = [
  "email ID",
  "vendor name",
  "company name"
];
export function VendorAccountsPanel({
  industries,
}: {
  industries: IndustryOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<VendorFilterValue>(() =>
    parseVendorFilter(searchParams.get("filter"))
  );
  const [search, setSearch] = useState(() => parseVendorSearch(searchParams.get("q")));
  const [allVendors, setAllVendors] = useState<VendorRow[]>(() => readVendorCache() ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(() => !readVendorCache());
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const displayed = useMemo(
    () => filterVendorRows(allVendors, filter, search),
    [allVendors, filter, search]
  );

  const metrics = useMemo(() => {
    let released = 0;
    let pending = 0;
    let held = 0;
    for (const v of allVendors) {
      if (v.portalAccess === "RELEASED") released++;
      if (v.portalAccess === "HELD") held++;
      if (v.mustChangePassword) pending++;
    }
    return { total: allVendors.length, released, pending, held };
  }, [allVendors]);

  const fetchAll = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    const background = opts?.background ?? false;

    if (!background) setRefreshing(true);
    if (!background && allVendors.length === 0) setInitialLoad(true);
    setLoadError(null);

    try {
      const result = await fetchTableJson<VendorRow>("/api/vendors");

      if (id !== requestId.current) return;

      if (!result.ok) {
        if (allVendors.length === 0) setLoadError(result.error);
        return;
      }

      setAllVendors(result.data);
      writeVendorCache(result.data);
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
    <div className="flex flex-1 flex-col min-h-0 space-y-6 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Vendors</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.total}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue transition-transform group-hover:scale-110">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Access Released</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.released}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-6 w-6 transition-all group-hover:animate-pulse" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Pending Setup</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.pending}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="h-6 w-6 transition-all group-hover:animate-[spin_3s_linear_infinite]" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Access Held</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.held}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <ShieldAlert className="h-6 w-6 transition-all group-hover:animate-bounce" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={refreshTable}
            disabled={refreshing}
            title="Refresh table data"
            aria-label="Refresh vendor table"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-brand-blue bg-white text-brand-blue transition-colors hover:bg-brand-blue/5 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-brand-blue/25 focus-visible:outline-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-blue" : ""}`} aria-hidden />
          </button>
          
          <AnimatedSearchInput
            value={search}
            onChange={onSearchChange}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search vendor accounts"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              onBlur={() => setTimeout(() => setFilterOpen(false), 200)}
              className="focus-visible:ring-brand-blue/25 flex items-center justify-between gap-3 rounded-full border border-brand-blue bg-white py-2.5 pl-5 pr-4 text-sm font-semibold text-brand-blue outline-none focus-visible:ring-[3px] transition-shadow min-w-[160px]"
            >
              <span>{VENDOR_FILTERS.find((f) => f.value === filter)?.label || "All"}</span>
              <ChevronDown className="h-4 w-4 text-brand-blue" />
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg z-50">
                {VENDOR_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      f.value === filter ? "bg-zinc-50 font-semibold text-brand-blue" : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <CreateVendorForm industries={industries} onCreated={updateRowInCache} />
        </div>
      </div>

      <SmoothScroll
        className={`flex-1 px-2 -mx-2 min-h-0 transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        <table className="w-full text-left text-sm border-separate border-spacing-y-3 -mt-3">
          <thead className="sticky top-0 z-10">
            <tr className="text-xs font-bold tracking-[0.08em] text-white bg-brand-blue uppercase">
              <th className="px-4 py-3 rounded-l-xl w-12 text-center"></th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Reg ID</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialLoad && displayed.length === 0 && (
              <tr className="bg-white ring-1 ring-zinc-200/50 rounded-xl">
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-600 rounded-xl">
                  Loading vendor accounts…
                </td>
              </tr>
            )}
            {loadError && displayed.length === 0 && !initialLoad && (
              <tr className="bg-white ring-1 ring-zinc-200/50 rounded-xl">
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-600 rounded-xl">
                  {loadError}
                </td>
              </tr>
            )}
            {!loadError && !initialLoad && displayed.length === 0 && (
              <tr className="bg-white ring-1 ring-inset ring-zinc-200/50 rounded-xl">
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-600 rounded-xl">
                  {`No vendor accounts${search ? ` matching “${search}”` : ""} in this view.`}
                </td>
              </tr>
            )}
            {displayed.map((v) => (
              <tr
                key={v.id}
                className="bg-white ring-1 ring-inset ring-zinc-200/50 rounded-xl transition-shadow hover:ring-brand-blue group cursor-pointer"
                onClick={(e) => {
                  // Prevent navigation if the user is clicking on the actions dropdown or other interactive elements
                  if ((e.target as HTMLElement).closest('button, a')) return;
                  router.push(`/vendors/${v.id}`);
                }}
              >
                <td className="px-4 py-4 rounded-l-xl text-center">
                  {v.portalAccess === "RELEASED" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                  ) : (
                    <Lock className="w-5 h-5 text-amber-500 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-zinc-950">{v.name || "—"}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-zinc-700">{v.email}</p>
                </td>
                <td className="px-4 py-4 text-zinc-700">
                  {v.registration ? (
                    <span className="font-medium">
                      {v.registration.company?.legalName || "—"}
                    </span>
                  ) : (
                    <span className="text-zinc-500">Added by RVCC</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {v.registration?.referenceNumber ? (
                    <p className="font-mono text-sm text-zinc-600 tabular-nums">
                      {v.registration.referenceNumber}
                    </p>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-zinc-600 tabular-nums">
                  {formatDateTime(v.lastLoginAt) ?? "Never"}
                </td>
                <td className="px-4 py-4 rounded-r-xl">
                  <VendorRowActions vendor={toSummary(v)} onUpdated={updateRowInCache} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SmoothScroll>
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
