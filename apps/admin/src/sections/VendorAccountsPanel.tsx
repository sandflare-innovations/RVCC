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
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);
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
    <div className="flex flex-1 flex-col min-h-0 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-6">
        {([
          { label: "Total Vendors", value: metrics.total, filterVal: "ALL" as const, icon: <Users className="h-4 w-4" /> },
          { label: "Access Released", value: metrics.released, filterVal: "RELEASED" as const, icon: <CheckCircle className="h-4 w-4" /> },
          { label: "Pending Setup", value: metrics.pending, filterVal: "PENDING" as const, icon: <Clock className="h-4 w-4" /> },
          { label: "Access Held", value: metrics.held, filterVal: "HELD" as const, icon: <ShieldAlert className="h-4 w-4" /> },
        ]).map((card) => (
          <button
            key={card.filterVal}
            type="button"
            onClick={() => applyFilter(card.filterVal)}
            className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 cursor-pointer shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">{card.label}</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                {card.icon}
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-nowrap items-center justify-between gap-4 shrink-0 mb-6">
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

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        {/* Fixed Top Header */}
        <div className="shrink-0 bg-brand-blue text-white rounded-2xl px-6 py-3.5 shadow-xs mb-2">
          <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold">
            <div className="col-span-3 min-w-0">Name</div>
            <div className="col-span-3 min-w-0">Email</div>
            <div className="col-span-2 min-w-0">Company</div>
            <div className="col-span-2 min-w-0">Reg ID</div>
            <div className="col-span-1 min-w-0">Last sign-in</div>
            <div className="col-span-1 min-w-0 text-right">Actions</div>
          </div>
        </div>

        {/* Scrollable Rows */}
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-2 pr-1">
          {initialLoad && displayed.length === 0 && (
            <div className="px-6 py-10 text-center text-zinc-600">
              Loading vendor accounts…
            </div>
          )}
          {loadError && displayed.length === 0 && !initialLoad && (
            <div className="px-6 py-10 text-center text-zinc-600">
              {loadError}
            </div>
          )}
          {!loadError && !initialLoad && displayed.length === 0 && (
            <div className="px-6 py-10 text-center text-zinc-600">
              {`No vendor accounts${search ? ` matching “${search}”` : ""} in this view.`}
            </div>
          )}
          {displayed.map((v) => (
            <div
              key={v.id}
              className={`grid grid-cols-12 gap-3 items-center group cursor-pointer bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl p-4 transition-all hover:ring-brand-blue/40 text-sm ${activeDropdownRow === v.id ? 'relative z-[60]' : ''}`}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button, a')) return;
                router.push(`/vendors/${v.id}`);
              }}
            >
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-3">
                  {v.portalAccess === "RELEASED" ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Lock className="h-5 w-5 shrink-0 text-amber-500" />
                  )}
                  <p className="font-medium text-zinc-950 truncate">{v.name || "—"}</p>
                </div>
              </div>
              <div className="col-span-3 min-w-0 text-zinc-700 text-xs truncate">{v.email}</div>
              <div className="col-span-2 min-w-0 text-zinc-700 truncate">
                {v.registration ? (
                  <span className="font-medium truncate block">
                    {v.registration.company?.legalName || "—"}
                  </span>
                ) : (
                  <span className="text-zinc-500">Added by RVCC</span>
                )}
              </div>
              <div className="col-span-2 min-w-0 font-mono text-xs text-zinc-600 tabular-nums truncate">
                {v.registration?.referenceNumber || "—"}
              </div>
              <div className="col-span-1 min-w-0 text-zinc-600 tabular-nums text-xs truncate">
                {formatDateTime(v.lastLoginAt) ?? "Never"}
              </div>
              <div className="col-span-1 min-w-0 text-right">
                <VendorRowActions vendor={toSummary(v)} onUpdated={updateRowInCache} onDropdownOpen={(open) => setActiveDropdownRow(open ? v.id : null)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VendorAccountsSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 w-full animate-pulse">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="h-3 w-20 rounded bg-zinc-100" />
              <div className="h-8 w-8 shrink-0 rounded-2xl bg-zinc-100" />
            </div>
            <div className="relative z-10 mt-3">
              <div className="h-7 w-12 rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-nowrap items-center justify-between gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="h-[42px] w-[42px] shrink-0 rounded-full border border-zinc-200 bg-white" />
          <div className="h-[42px] flex-1 rounded-full border border-zinc-200 bg-white" />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-40 rounded-full border border-zinc-200 bg-white" />
          <div className="h-10 w-10 rounded-full bg-zinc-100" />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
        <div className="overflow-hidden">
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-white">
                {['Name', 'Email', 'Company', 'Reg ID', 'Last sign-in', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap bg-zinc-100 px-8 py-3.5 font-semibold ${i === 0 ? 'rounded-l-2xl' : ''} ${i === 5 ? 'rounded-r-2xl text-right' : ''}`}
                  >
                    <div className="h-3 rounded bg-zinc-200" style={{ width: h === 'Name' ? '60px' : h === 'Actions' ? '48px' : '80px' }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl">
                  <td className="sticky left-0 z-10 whitespace-nowrap rounded-l-2xl bg-white px-8 py-4 ring-1 ring-inset ring-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 shrink-0 rounded-full bg-zinc-100" />
                      <div className="h-4 w-32 rounded bg-zinc-100" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-36 rounded bg-zinc-100" />
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-28 rounded bg-zinc-100" />
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-20 rounded bg-zinc-100" />
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-28 rounded bg-zinc-100" />
                  </td>
                  <td className="sticky right-0 z-10 whitespace-nowrap rounded-r-2xl bg-white px-8 py-4 ring-1 ring-inset ring-zinc-100">
                    <div className="h-8 w-8 ml-auto rounded-full bg-zinc-100" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
