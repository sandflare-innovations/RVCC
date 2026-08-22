"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import Link from "next/link";
import { SmoothScroll } from "@/components/ui";

import { RefreshCw, Search, ChevronDown, FileText, Radio, Edit2, Award, ChevronUp, CircleDashed, ShieldAlert, CheckCircle, Clock, XCircle, Lock, Trophy } from "lucide-react";

import { fetchTableJson } from "@/lib/table-fetch";
import { AnimatedSearchInput } from "@/lib/ui";
import { readVendorCache, writeVendorCache, type CachedVendorRow } from "@/lib/vendor-cache";
import {
  readRequirementsCache,
  writeRequirementsCache,
  type CachedRequirementRow,
} from "@/lib/requirements-cache";
import {
  filterRequirementRows,
  parseRequirementFilter,
  parseRequirementSearch,
  REQUIREMENT_FILTERS,
  type RequirementFilterValue,
} from "@/lib/requirement-filters";

type RequirementRow = CachedRequirementRow;

function syncUrl(filter: RequirementFilterValue, search: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("filter", filter);
  if (search) url.searchParams.set("q", search);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusIcon(status: string, closesAt: string | null) {
  if (status === "OPEN" && closesAt) {
    const date = new Date(closesAt);
    if (!isNaN(date.getTime()) && date.getTime() <= Date.now()) {
      return <Lock className="h-4 w-4 text-purple-500 mr-2" />;
    }
    return (
      <div className="relative mr-2 flex items-center justify-center h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
      </div>
    );
  }
  
  if (status === "DRAFT") return <CircleDashed className="h-4 w-4 text-amber-500 mr-2" />;
  if (status === "AWARDED") return <Trophy className="h-4 w-4 text-brand-blue mr-2" />;
  if (status === "CANCELLED") return <XCircle className="h-4 w-4 text-rose-500 mr-2" />;
  
  return <Clock className="h-4 w-4 text-zinc-400 mr-2" />;
}

function statusLabel(status: string, closesAt: string | null) {
  if (status === "OPEN" && closesAt) {
    const date = new Date(closesAt);
    if (!isNaN(date.getTime()) && date.getTime() <= Date.now()) {
      return (
        <span className="inline-flex items-center text-purple-700 font-medium">
          {statusIcon(status, closesAt)}
          Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-emerald-700 font-medium">
        {statusIcon(status, closesAt)}
        Open
      </span>
    );
  }
  
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center text-amber-700 font-medium">
        {statusIcon(status, closesAt)}
        Draft
      </span>
    );
  }
  
  if (status === "AWARDED") {
    return (
      <span className="inline-flex items-center text-brand-blue font-medium">
        {statusIcon(status, closesAt)}
        Awarded
      </span>
    );
  }
  
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center text-rose-700 font-medium">
        {statusIcon(status, closesAt)}
        Cancelled
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center text-zinc-700 font-medium">
      {statusIcon(status, closesAt)}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

const SEARCH_PLACEHOLDERS = [
  "reference ID",
  "project name"
];

export function RequirementsPanel() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<RequirementFilterValue>(() =>
    parseRequirementFilter(searchParams.get("filter"))
  );
  const [search, setSearch] = useState(() => parseRequirementSearch(searchParams.get("q")));
  const [allRows, setAllRows] = useState<RequirementRow[]>(() => readRequirementsCache() ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(() => !readRequirementsCache());
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortCol, setSortCol] = useState<"createdAt" | "closesAt">("createdAt");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const displayed = useMemo(() => {
    const filtered = filterRequirementRows(allRows, filter, search);
    return filtered.sort((a, b) => {
      const aVal = a[sortCol] ? new Date(a[sortCol]).getTime() : 0;
      const bVal = b[sortCol] ? new Date(b[sortCol]).getTime() : 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [allRows, filter, search, sortCol, sortDir]);

  const metrics = useMemo(() => {
    let open = 0;
    let draft = 0;
    let closed = 0;
    for (const r of allRows) {
      const isExpired = r.closesAt && new Date(r.closesAt).getTime() <= Date.now();
      if (r.status === "OPEN" && !isExpired) open++;
      else if (r.status === "DRAFT") draft++;
      else if ((r.status === "OPEN" && isExpired) || r.status === "AWARDED" || r.status === "CLOSED") closed++;
    }
    return { total: allRows.length, open, draft, closed };
  }, [allRows]);

  const applyFilter = (next: RequirementFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
      syncUrl(next, search);
    });
  };

  const onSearchChange = (value: string) => {
    const next = parseRequirementSearch(value);
    setSearch(next);
    syncUrl(filter, next);
  };


  const fetchRequirements = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    const background = opts?.background ?? false;

    if (!background) setRefreshing(true);
    if (!background && allRows.length === 0) setInitialLoad(true);
    setLoadError(null);

    try {
      const result = await fetchTableJson<RequirementRow>("/api/requirements");

      if (id !== requestId.current) return;

      if (!result.ok) {
        if (allRows.length === 0) setLoadError(result.error);
        return;
      }

      setAllRows(result.data);
      writeRequirementsCache(result.data);
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
    const cached = readRequirementsCache();
    if (cached?.length) {
      setAllRows(cached);
      setInitialLoad(false);
      void fetchRequirements({ background: true });
    } else {
      void fetchRequirements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-0 space-y-6 w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Total RFQs</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.total}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue transition-transform group-hover:scale-110">
            <FileText className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Open & Bidding</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.open}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 relative">
            <Radio className="h-6 w-6 transition-all group-hover:animate-pulse" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Drafts</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.draft}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Edit2 className="h-6 w-6 transition-transform group-hover:-translate-y-1" />
          </div>
        </div>
        <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors">
          <div>
            <p className="text-sm font-medium text-zinc-500">Closed / Awarded</p>
            <p className="text-2xl font-semibold text-zinc-950 mt-1">{metrics.closed}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Award className="h-6 w-6 transition-transform group-hover:scale-125 group-hover:-rotate-12" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={() => void fetchRequirements()}
            disabled={refreshing}
            title="Refresh table data"
            aria-label="Refresh requirements table"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-brand-blue bg-white text-brand-blue transition-colors hover:bg-brand-blue/5 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-brand-blue/25 focus-visible:outline-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-blue" : ""}`} aria-hidden />
          </button>
          
          <AnimatedSearchInput
            value={search}
            onChange={onSearchChange}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search requirements"
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
              <span>{REQUIREMENT_FILTERS.find((f) => f.value === filter)?.label || "All"}</span>
              <ChevronDown className="h-4 w-4 text-brand-blue" />
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg z-50">
                {REQUIREMENT_FILTERS.map((f) => (
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
          <Link
            href="/requirements/new"
            className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none shrink-0"
          >
            <FileText className="h-4 w-4" />
            Post a requirement
          </Link>
        </div>
      </div>

      <SmoothScroll
        className={`flex-1 px-2 -mx-2 min-h-0 transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        <table className="w-full text-left text-sm border-separate border-spacing-y-3 -mt-3">
          <thead className="sticky top-0 z-10">
            <tr className="text-xs font-bold tracking-[0.08em] text-white bg-brand-blue uppercase">
              <th className="px-4 py-3 rounded-l-xl">Status</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-white/10 transition-colors" onClick={() => {
                if (sortCol === "createdAt") setSortDir(d => d === "asc" ? "desc" : "asc");
                else { setSortCol("createdAt"); setSortDir("desc"); }
              }}>
                <div className="flex items-center gap-1">
                  Posted Date
                  {sortCol === "createdAt" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none hover:bg-white/10 transition-colors" onClick={() => {
                if (sortCol === "closesAt") setSortDir(d => d === "asc" ? "desc" : "asc");
                else { setSortCol("closesAt"); setSortDir("desc"); }
              }}>
                <div className="flex items-center gap-1">
                  Closes Date
                  {sortCol === "closesAt" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
              </th>
              <th className="px-4 py-3">Invited</th>
              <th className="px-4 py-3 rounded-r-xl">Quotes</th>
            </tr>
          </thead>
          <tbody>
            {initialLoad && displayed.length === 0 && (
              <tr className="bg-white ring-1 ring-zinc-200/50 rounded-xl">
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-600 rounded-xl">
                  Loading requirements…
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
              <tr className="bg-white ring-1 ring-zinc-200/50 rounded-xl">
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-600 rounded-xl">
                  Nothing posted yet.
                </td>
              </tr>
            )}
            {displayed.map((r) => (
              <tr key={r.id} className="bg-white ring-1 ring-inset ring-zinc-200/50 rounded-xl transition-shadow hover:ring-brand-blue group cursor-pointer" onClick={() => window.location.href = `/requirements/${r.id}`}>
                <td className="px-4 py-3 rounded-l-xl">
                  {statusLabel(r.status, r.closesAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-brand-blue font-mono text-xs tabular-nums font-medium group-hover:underline">
                    {r.referenceNumber ?? "— draft —"}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900">{r.project}</td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDateTime(r.createdAt)}
                </td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDateTime(r.closesAt)}
                </td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">{r.invited}</td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums rounded-r-xl">{r.submitted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SmoothScroll>
    </div>
  );
}

export function RequirementsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-zinc-200" />
        <div className="h-4 w-full max-w-xl rounded bg-zinc-100" />
      </div>
      <div className="h-10 w-40 rounded bg-zinc-100" />
      <div className="h-64 rounded-lg border border-zinc-200 bg-white" />
    </div>
  );
}
