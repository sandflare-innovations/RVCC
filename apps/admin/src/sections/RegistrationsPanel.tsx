"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import countries from "world-countries";

import { RefreshCw, Search, ChevronDown, FileText, CheckCircle, Clock, XCircle, FileCheck, Loader, ChevronUp } from "lucide-react";

import { StatusBadge, AnimatedSearchInput } from "@/lib/ui";
import { fetchTableJson } from "@/lib/table-fetch";
import {
  readRegistrationCache,
  writeRegistrationCache,
  type CachedRegistrationRow,
} from "@/lib/registration-cache";
import {
  REGISTRATION_FILTERS,
  filterRegistrationRows,
  parseRegistrationFilter,
  parseRegistrationSearch,
  type RegistrationFilterValue,
} from "@/lib/registration-filters";
import {
  RegistrationRowActions,
  type RegistrationSummary,
} from "@/sections/RegistrationRowActions";

type RegistrationRow = CachedRegistrationRow;

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

function syncUrl(status: RegistrationFilterValue, search: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("status", status);
  if (search) url.searchParams.set("q", search);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

function getCountryData(countryString: string | null) {
  if (!countryString) return null;

  // Try to find by name first (what the web app saves)
  const byName = countries.find(c => c.name.common.toLowerCase() === countryString.toLowerCase());
  if (byName) return byName;

  // Try by cca2
  if (countryString.length === 2) {
    const byCode = countries.find(c => c.cca2.toLowerCase() === countryString.toLowerCase());
    if (byCode) return byCode;
  }

  return null;
}

function getCountryFlag(country: string | null) {
  const data = getCountryData(country);
  if (data) {
    return <span className={`fi fi-${data.cca2.toLowerCase()} rounded-[2px] shadow-sm text-base`}></span>;
  }
  return <span className="text-base text-zinc-400 leading-none">🌍</span>;
}

function getCountryName(country: string | null) {
  const data = getCountryData(country);
  return data ? data.name.common : country;
}

function toSummary(r: RegistrationRow): RegistrationSummary {
  return {
    id: r.id,
    email: r.email,
    status: r.status,
    referenceNumber: r.referenceNumber,
    companyName: r.company?.legalName ?? null,
  };
}

const SEARCH_PLACEHOLDERS = [
  "company name",
  "email ID",
  "country name",
  "reference ID"
];

export function RegistrationsPanel({ canDelete }: { canDelete: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<RegistrationFilterValue>(() =>
    parseRegistrationFilter(searchParams.get("status"))
  );
  const [search, setSearch] = useState(() => parseRegistrationSearch(searchParams.get("q")));
  const [allRows, setAllRows] = useState<RegistrationRow[]>(() => readRegistrationCache() ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(() => !readRegistrationCache());
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [activeDropdownRow, setActiveDropdownRow] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const displayed = useMemo(() => {
    const filtered = filterRegistrationRows(allRows, filter, search);
    return filtered.sort((a, b) => {
      const aDate = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const bDate = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return sortDir === "desc" ? bDate - aDate : aDate - bDate;
    });
  }, [allRows, filter, search, sortDir]);

  const metrics = useMemo(() => {
    let approved = 0;
    let underReview = 0;
    let rejected = 0;
    for (const r of allRows) {
      if (r.status === "APPROVED") approved++;
      if (r.status === "SUBMITTED") underReview++;
      if (r.status === "REJECTED") rejected++;
    }
    return { total: allRows.length, approved, underReview, rejected };
  }, [allRows]);

  const fetchAll = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    const background = opts?.background ?? false;

    if (!background) setRefreshing(true);
    if (!background && allRows.length === 0) setInitialLoad(true);
    setLoadError(null);

    try {
      const result = await fetchTableJson<RegistrationRow>("/api/registrations");

      if (id !== requestId.current) return;

      if (!result.ok) {
        if (allRows.length === 0) setLoadError(result.error);
        return;
      }

      setAllRows(result.data);
      writeRegistrationCache(result.data);
    } catch {
      if (id !== requestId.current) return;
      if (allRows.length === 0) setLoadError("Network error — please try again.");
    } finally {
      if (id === requestId.current) {
        setRefreshing(false);
        setInitialLoad(false);
      }
    }
  }, [allRows.length]);

  useEffect(() => {
    const cached = readRegistrationCache();
    if (cached?.length) {
      setAllRows(cached);
      setInitialLoad(false);
      void fetchAll({ background: true });
    } else {
      void fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const applyFilter = (next: RegistrationFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
      syncUrl(next, search);
    });
  };

  const onSearchChange = (value: string) => {
    const next = parseRegistrationSearch(value);
    setSearch(next);
    syncUrl(filter, next);
  };

  const updateTable = useCallback(() => {
    void fetchAll({ background: true });
  }, [fetchAll]);

  const removeRow = useCallback((id: string) => {
    setAllRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeRegistrationCache(next);
      return next;
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-6">
        {([
          { label: "Total Registrations", value: metrics.total, filterVal: "ALL" as const, icon: <FileText className="h-4 w-4" /> },
          { label: "Approved", value: metrics.approved, filterVal: "APPROVED" as const, icon: <CheckCircle className="h-4 w-4" /> },
          { label: "Under Review", value: metrics.underReview, filterVal: "SUBMITTED" as const, icon: <FileCheck className="h-4 w-4" /> },
          { label: "Rejected Applications", value: metrics.rejected, filterVal: "REJECTED" as const, icon: <XCircle className="h-4 w-4" /> },
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
            onClick={() => void fetchAll()}
            disabled={refreshing}
            title="Refresh table data"
            aria-label="Refresh registrations table"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-brand-blue bg-white text-brand-blue transition-colors hover:bg-brand-blue/5 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-brand-blue/25 focus-visible:outline-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-blue" : ""}`} aria-hidden />
          </button>

          <AnimatedSearchInput
            value={search}
            onChange={onSearchChange}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search registrations"
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
              <span>{REGISTRATION_FILTERS.find((f) => f.value === filter)?.label || "All"}</span>
              <ChevronDown className="h-4 w-4 text-brand-blue" />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg z-50">
                {REGISTRATION_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${f.value === filter ? "bg-zinc-50 font-semibold text-brand-blue" : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                  >
                    {f.value === "APPROVED" ? (
                      <CheckCircle className={`w-4 h-4 ${f.value === filter ? "text-emerald-500" : "text-emerald-500/70"}`} />
                    ) : f.value === "SUBMITTED" ? (
                      <FileCheck className={`w-4 h-4 ${f.value === filter ? "text-brand-blue" : "text-brand-blue/70"}`} />
                    ) : f.value === "REJECTED" ? (
                      <XCircle className={`w-4 h-4 ${f.value === filter ? "text-rose-500" : "text-rose-500/70"}`} />
                    ) : f.value === "DRAFT" ? (
                      <Loader className={`w-4 h-4 ${f.value === filter ? "text-amber-500" : "text-amber-500/70"}`} />
                    ) : (
                      <span className="w-4 h-4" />
                    )}
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-white">
                <th className="sticky top-0 left-0 z-40 whitespace-nowrap rounded-l-2xl bg-brand-blue px-8 py-3.5 font-semibold">Company</th>
                <th
                  className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-8 py-3.5 font-semibold cursor-pointer select-none hover:bg-brand-blue/90 transition-colors"
                  onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
                  title="Toggle sort by date"
                >
                  <div className="flex items-center gap-1.5">
                    Submitted
                    {sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                </th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-8 py-3.5 font-semibold">Country</th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-8 py-3.5 font-semibold">Contact email</th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-8 py-3.5 font-semibold">Reference</th>
                <th className="sticky top-0 right-0 z-40 whitespace-nowrap rounded-r-2xl bg-brand-blue px-8 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLoad && displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-600">
                    Loading registrations…
                  </td>
                </tr>
              )}
              {loadError && displayed.length === 0 && !initialLoad && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-600">
                    {loadError}
                  </td>
                </tr>
              )}
              {!loadError && !initialLoad && displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-600">
                    {`No registrations${search ? ` matching “${search}”` : ""} in this view.`}
                  </td>
                </tr>
              )}
              {displayed.map((r) => (
                <tr
                  key={r.id}
                  className={`group cursor-pointer bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl transition-all hover:ring-brand-blue/40 ${activeDropdownRow === r.id ? 'relative z-[60]' : ''}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a')) return;
                    router.push(`/registrations/${r.id}`);
                  }}
                >
                  <td className="sticky left-0 z-10 whitespace-nowrap rounded-l-2xl bg-white px-8 py-4 ring-1 ring-inset ring-zinc-100 group-hover:ring-brand-blue/40">
                    <div className="flex items-center gap-3">
                      {r.status === "APPROVED" ? (
                        <span title="Approved"><CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" /></span>
                      ) : r.status === "SUBMITTED" ? (
                        <span title="Awaiting Review"><FileCheck className="h-5 w-5 shrink-0 text-brand-blue" /></span>
                      ) : r.status === "REJECTED" ? (
                        <span title="Rejected"><XCircle className="h-5 w-5 shrink-0 text-rose-500" /></span>
                      ) : (
                        <span title="In Progress"><Loader className="h-5 w-5 shrink-0 text-amber-500" /></span>
                      )}
                      <Link
                        href={`/registrations/${r.id}`}
                        className="hover:text-brand-blue font-medium text-zinc-950 underline-offset-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.company?.legalName || <span className="text-zinc-500">Unnamed</span>}
                      </Link>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-8 py-4 text-zinc-600 tabular-nums">
                    {formatDate(r.submittedAt)}
                  </td>
                  <td className="whitespace-nowrap px-8 py-4 text-zinc-700">
                    {r.company?.country ? (
                      <div className="flex items-center gap-2">
                        {getCountryFlag(r.company.country)}
                        <span>{getCountryName(r.company.country)}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-8 py-4 text-zinc-700">{r.email}</td>
                  <td className="whitespace-nowrap px-8 py-4 font-mono text-sm text-zinc-600 tabular-nums">
                    {r.referenceNumber || "—"}
                  </td>
                  <td className="sticky right-0 z-10 whitespace-nowrap rounded-r-2xl bg-white px-8 py-4 ring-1 ring-inset ring-zinc-100 group-hover:ring-brand-blue/40">
                    <RegistrationRowActions
                      registration={toSummary(r)}
                      canDelete={canDelete}
                      onDeleted={() => removeRow(r.id)}
                      onUpdated={updateTable}
                      onDropdownOpen={(open) => setActiveDropdownRow(open ? r.id : null)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {displayed.length === 500 && (
        <p className="text-xs text-zinc-500 shrink-0">
          Showing the first 500 results — narrow the search to see more.
        </p>
      )}
    </div>
  );
}

export function RegistrationsSkeleton() {
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
        </div>
      </div>

      {/* Table Container */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
        <div className="overflow-hidden">
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-white">
                {['Company', 'Submitted', 'Country', 'Contact email', 'Reference', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap bg-zinc-100 px-8 py-3.5 font-semibold ${i === 0 ? 'rounded-l-2xl' : ''} ${i === 5 ? 'rounded-r-2xl text-right' : ''}`}
                  >
                    <div className="h-3 rounded bg-zinc-200" style={{ width: h === 'Company' ? '80px' : h === 'Actions' ? '48px' : '72px' }} />
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
                    <div className="h-4 w-24 rounded bg-zinc-100" />
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-24 rounded bg-zinc-100" />
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-36 rounded bg-zinc-100" />
                  </td>
                  <td className="whitespace-nowrap px-8 py-4">
                    <div className="h-4 w-20 rounded bg-zinc-100" />
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
