"use client";

import {
  Award,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock,
  Edit2,
  FileText,
  Lock,
  Radio,
  RefreshCw,
  Trophy,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  filterRequirementRows,
  parseRequirementFilter,
  parseRequirementSearch,
  REQUIREMENT_FILTERS,
  type RequirementFilterValue,
} from "@/lib/requirement-filters";
import {
  type CachedRequirementRow,
  readRequirementsCache,
  writeRequirementsCache,
} from "@/lib/requirements-cache";
import { fetchTableJson } from "@/lib/table-fetch";
import { AnimatedSearchInput } from "@/lib/ui";

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
      return <Lock className="mr-2 h-4 w-4 text-purple-500" />;
    }
    return (
      <div className="relative mr-2 flex h-4 w-4 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
      </div>
    );
  }

  if (status === "DRAFT") return <CircleDashed className="mr-2 h-4 w-4 text-amber-500" />;
  if (status === "AWARDED") return <Trophy className="text-brand-blue mr-2 h-4 w-4" />;
  if (status === "CANCELLED") return <XCircle className="mr-2 h-4 w-4 text-rose-500" />;

  return <Clock className="mr-2 h-4 w-4 text-zinc-400" />;
}

function statusLabel(status: string, closesAt: string | null) {
  if (status === "OPEN" && closesAt) {
    const date = new Date(closesAt);
    if (!isNaN(date.getTime()) && date.getTime() <= Date.now()) {
      return (
        <span className="inline-flex items-center font-medium text-purple-700">
          {statusIcon(status, closesAt)}
          Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center font-medium text-emerald-700">
        {statusIcon(status, closesAt)}
        Open
      </span>
    );
  }

  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center font-medium text-amber-700">
        {statusIcon(status, closesAt)}
        Draft
      </span>
    );
  }

  if (status === "AWARDED") {
    return (
      <span className="text-brand-blue inline-flex items-center font-medium">
        {statusIcon(status, closesAt)}
        Awarded
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center font-medium text-rose-700">
        {statusIcon(status, closesAt)}
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center font-medium text-zinc-700">
      {statusIcon(status, closesAt)}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

const SEARCH_PLACEHOLDERS = ["reference ID", "project name"];

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
      else if (
        (r.status === "OPEN" && isExpired) ||
        r.status === "AWARDED" ||
        r.status === "CLOSED"
      )
        closed++;
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

  const fetchRequirements = useCallback(
    async (opts?: { background?: boolean }) => {
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
    },
    [allRows.length]
  );

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
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="mb-6 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total RFQs",
            value: metrics.total,
            filterVal: "ALL" as const,
            icon: <FileText className="h-4 w-4" />,
          },
          {
            label: "Open & Bidding",
            value: metrics.open,
            filterVal: "OPEN" as const,
            icon: <Radio className="h-4 w-4" />,
          },
          {
            label: "Drafts",
            value: metrics.draft,
            filterVal: "DRAFT" as const,
            icon: <Edit2 className="h-4 w-4" />,
          },
          {
            label: "Closed / Awarded",
            value: metrics.closed,
            filterVal: "CLOSED" as const,
            icon: <Award className="h-4 w-4" />,
          },
        ].map((card) => (
          <button
            key={card.filterVal}
            type="button"
            onClick={() => applyFilter(card.filterVal)}
            className="group focus-visible:ring-brand-blue/40 relative flex h-full min-h-0 cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                {card.label}
              </p>
              <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
                {card.icon}
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
                {card.value}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mb-6 flex shrink-0 flex-nowrap items-center justify-between gap-4">
        <div className="flex w-full max-w-sm items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchRequirements()}
            disabled={refreshing}
            title="Refresh table data"
            aria-label="Refresh requirements table"
            className="border-brand-blue text-brand-blue hover:bg-brand-blue/5 focus-visible:ring-brand-blue/25 inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border bg-white transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "text-brand-blue animate-spin" : ""}`}
              aria-hidden
            />
          </button>

          <AnimatedSearchInput
            value={search}
            onChange={onSearchChange}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search requirements"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              onBlur={() => setTimeout(() => setFilterOpen(false), 200)}
              className="focus-visible:ring-brand-blue/25 border-brand-blue text-brand-blue flex min-w-[160px] items-center justify-between gap-3 rounded-full border bg-white py-2.5 pr-4 pl-5 text-sm font-semibold transition-shadow outline-none focus-visible:ring-[3px]"
            >
              <span>{REQUIREMENT_FILTERS.find((f) => f.value === filter)?.label || "All"}</span>
              <ChevronDown className="text-brand-blue h-4 w-4" />
            </button>

            {filterOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-48 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg">
                {REQUIREMENT_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      f.value === filter
                        ? "text-brand-blue bg-zinc-50 font-semibold"
                        : "text-zinc-700 hover:bg-zinc-50"
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
            className="bg-brand-blue hover:bg-brand-blue/90 inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <FileText className="h-4 w-4" />
            Post a requirement
          </Link>
        </div>
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        {/* Fixed Top Header */}
        <div className="bg-brand-blue mb-2 shrink-0 rounded-2xl px-6 py-3.5 text-white shadow-xs">
          <div className="grid grid-cols-12 items-center gap-3 text-xs font-semibold">
            <div className="col-span-3 min-w-0">Project</div>
            <div className="col-span-2 min-w-0">Status</div>
            <div className="col-span-2 min-w-0">Reference</div>
            <div
              className="col-span-2 flex min-w-0 cursor-pointer items-center gap-1 transition-colors select-none hover:text-white/80"
              onClick={() => {
                if (sortCol === "createdAt") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else {
                  setSortCol("createdAt");
                  setSortDir("desc");
                }
              }}
            >
              <span>Posted Date</span>
              {sortCol === "createdAt" &&
                (sortDir === "asc" ? (
                  <ChevronUp className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ))}
            </div>
            <div
              className="col-span-2 flex min-w-0 cursor-pointer items-center gap-1 transition-colors select-none hover:text-white/80"
              onClick={() => {
                if (sortCol === "closesAt") setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                else {
                  setSortCol("closesAt");
                  setSortDir("desc");
                }
              }}
            >
              <span>Closes Date</span>
              {sortCol === "closesAt" &&
                (sortDir === "asc" ? (
                  <ChevronUp className="h-3 w-3 shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ))}
            </div>
            <div className="col-span-1 min-w-0 text-right">Quotes</div>
          </div>
        </div>

        {/* Scrollable Rows */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 [scrollbar-width:none] space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {initialLoad && displayed.length === 0 && (
            <div className="px-6 py-10 text-center text-zinc-600">Loading requirements…</div>
          )}
          {loadError && displayed.length === 0 && !initialLoad && (
            <div className="px-6 py-10 text-center text-zinc-600">{loadError}</div>
          )}
          {!loadError && !initialLoad && displayed.length === 0 && (
            <div className="px-6 py-10 text-center text-zinc-600">Nothing posted yet.</div>
          )}
          {displayed.map((r) => (
            <div
              key={r.id}
              className="group hover:ring-brand-blue/40 grid cursor-pointer grid-cols-12 items-center gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-zinc-100 transition-all ring-inset"
              onClick={() => (window.location.href = `/requirements/${r.id}`)}
            >
              <div className="col-span-3 min-w-0 truncate font-medium text-zinc-900">
                {r.project}
              </div>
              <div className="col-span-2 min-w-0 truncate">{statusLabel(r.status, r.closesAt)}</div>
              <div className="text-brand-blue col-span-2 min-w-0 truncate font-mono text-xs font-medium tabular-nums group-hover:underline">
                {r.referenceNumber ?? "— draft —"}
              </div>
              <div className="col-span-2 min-w-0 truncate text-xs text-zinc-600 tabular-nums">
                {formatDateTime(r.createdAt)}
              </div>
              <div className="col-span-2 min-w-0 truncate text-xs text-zinc-600 tabular-nums">
                {formatDateTime(r.closesAt)}
              </div>
              <div className="col-span-1 min-w-0 truncate text-right font-mono text-xs text-zinc-600 tabular-nums">
                {r.submitted} ({r.invited} inv)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RequirementsSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-1 animate-pulse flex-col">
      {/* KPI Cards */}
      <div className="mb-6 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
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
      <div className="mb-6 flex shrink-0 flex-nowrap items-center justify-between gap-4">
        <div className="flex w-full max-w-sm items-center gap-3">
          <div className="h-[42px] w-[42px] shrink-0 rounded-full border border-zinc-200 bg-white" />
          <div className="h-[42px] flex-1 rounded-full border border-zinc-200 bg-white" />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="h-10 w-40 rounded-full border border-zinc-200 bg-white" />
          <div className="h-11 w-36 rounded-full bg-zinc-100" />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
        {/* Table Header */}
        <div className="overflow-hidden">
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-white">
                {[
                  "Project",
                  "Status",
                  "Reference",
                  "Posted Date",
                  "Closes Date",
                  "Invited",
                  "Quotes",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`bg-zinc-100 px-8 py-3.5 font-semibold whitespace-nowrap ${i === 0 ? "rounded-l-2xl" : ""} ${i === 6 ? "rounded-r-2xl" : ""}`}
                  >
                    <div
                      className="h-3 rounded bg-zinc-200"
                      style={{ width: h === "Project" ? "80px" : h === "Status" ? "48px" : "64px" }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="rounded-2xl bg-white ring-1 ring-zinc-100 ring-inset">
                  <td className="sticky left-0 z-10 rounded-l-2xl bg-white px-8 py-4 whitespace-nowrap ring-1 ring-zinc-100 ring-inset">
                    <div className="h-4 w-36 rounded bg-zinc-100" />
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="h-4 w-20 rounded bg-zinc-100" />
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="h-4 w-24 rounded bg-zinc-100" />
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="h-4 w-32 rounded bg-zinc-100" />
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="h-4 w-32 rounded bg-zinc-100" />
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="h-4 w-8 rounded bg-zinc-100" />
                  </td>
                  <td className="rounded-r-2xl px-8 py-4 whitespace-nowrap">
                    <div className="h-4 w-8 rounded bg-zinc-100" />
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
