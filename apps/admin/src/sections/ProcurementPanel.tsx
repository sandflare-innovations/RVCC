"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  FileCheck,
  Loader,
  RotateCcw,
  ShoppingBag,
  Building,
  Layers,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  User,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";


import { AnimatedSearchInput } from "@/lib/ui";
import { fetchTableJson } from "@/lib/table-fetch";
import {
  readProcurementCache,
  writeProcurementCache,
} from "@/lib/procurement/procurement-cache";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/procurement/formatters";

type ProcurementFilterValue =
  | "ALL"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED";

const PROCUREMENT_FILTERS: { value: ProcurementFilterValue; label: string }[] = [
  { value: "ALL", label: "All Requisitions" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REVISION_REQUESTED", label: "Revision Requested" },
];

const SEARCH_PLACEHOLDERS = [
  "title or material",
  "PR reference number",
  "requester name",
  "department name",
];

export function ProcurementPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<ProcurementFilterValue>("ALL");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeSortBy, setActiveSortBy] = useState<"date" | "priority">("date");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const [allRows, setAllRows] = useState<PurchaseRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const toggleSort = (mode: "date" | "priority") => {
    if (activeSortBy === mode) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setActiveSortBy(mode);
      setSortDir("desc");
    }
  };






  const fetchAll = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    if (!opts?.background) setRefreshing(true);
    setLoadError(null);

    try {
      const result = await fetchTableJson<PurchaseRequest>("/api/procurement");
      if (id !== requestId.current) return;

      if (!result.ok) {
        if (allRows.length === 0) setLoadError(result.error);
        return;
      }

      setAllRows(result.data);
      writeProcurementCache(result.data);
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
    const cached = readProcurementCache();
    if (cached?.length) {
      setAllRows(cached);
      setInitialLoad(false);
      void fetchAll({ background: true });
    } else {
      void fetchAll();
    }
  }, [fetchAll]);


  // Metrics for Top 4 Cards
  const metrics = useMemo(() => {
    const total = allRows.length;
    const approved = allRows.filter((r) => r.status === "approved").length;
    const underReview = allRows.filter(
      (r) => r.status === "under_review" || r.status === "submitted"
    ).length;
    const rejected = allRows.filter((r) => r.status === "rejected").length;
    return { total, approved, underReview, rejected };
  }, [allRows]);

  // Priority weight for sorting: urgent=4, high=3, medium=2, low=1
  const priorityWeight: Record<string, number> = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  // Filter & Search Logic with Sorting by Date or Priority
  const displayed = useMemo(() => {
    return allRows
      .filter((r) => {
        if (filter === "SUBMITTED" && r.status !== "submitted") return false;
        if (filter === "UNDER_REVIEW" && r.status !== "under_review") return false;
        if (filter === "APPROVED" && r.status !== "approved") return false;
        if (filter === "REJECTED" && r.status !== "rejected") return false;
        if (filter === "REVISION_REQUESTED" && r.status !== "revision_requested") return false;

        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.referenceNumber.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q) ||
          r.priority.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (activeSortBy === "priority") {
          const weightA = priorityWeight[a.priority.toLowerCase()] || 0;
          const weightB = priorityWeight[b.priority.toLowerCase()] || 0;
          if (weightA !== weightB) {
            return sortDir === "desc" ? weightB - weightA : weightA - weightB;
          }
          // Secondary sort by date
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return timeB - timeA;
        } else {
          // Sort by Date
          const timeA = new Date(a.createdAt).getTime() || 0;
          const timeB = new Date(b.createdAt).getTime() || 0;
          return sortDir === "desc" ? timeB - timeA : timeA - timeB;
        }
      });
  }, [allRows, filter, search, activeSortBy, sortDir]);





  const applyFilter = (next: ProcurementFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
    });
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full">
      {/* KPI 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-6">
        {[
          {
            label: "Total Requisitions",
            value: metrics.total,
            filterVal: "ALL" as const,
            icon: <ShoppingBag className="h-4 w-4" />,
          },
          {
            label: "Approved",
            value: metrics.approved,
            filterVal: "APPROVED" as const,
            icon: <CheckCircle className="h-4 w-4" />,
          },
          {
            label: "Under Review / New",
            value: metrics.underReview,
            filterVal: "UNDER_REVIEW" as const,
            icon: <Clock className="h-4 w-4" />,
          },
          {
            label: "Rejected Requisitions",
            value: metrics.rejected,
            filterVal: "REJECTED" as const,
            icon: <XCircle className="h-4 w-4" />,
          },
        ].map((card) => (
          <button
            key={card.filterVal}
            type="button"
            onClick={() => applyFilter(card.filterVal)}
            className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 cursor-pointer shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                {card.label}
              </p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
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

      {/* Action Bar (Search + Filter + View Mode Switch + Refresh) */}
      <div className="flex flex-wrap items-center justify-between gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-sm">
          <button
            type="button"
            onClick={() => void fetchAll()}
            disabled={refreshing}
            title="Refresh table data"
            aria-label="Refresh procurements table"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-brand-blue bg-white text-brand-blue transition-colors hover:bg-brand-blue/5 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-brand-blue/25 focus-visible:outline-none cursor-pointer"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin text-brand-blue" : ""}`}
              aria-hidden
            />
          </button>


          <AnimatedSearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search procurements"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* View Mode Toggle Button: Table vs Cards (Clean border without gray background) */}
          <div className="flex items-center rounded-full border border-brand-blue bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-blue text-white shadow-2xs font-bold"
                  : "text-brand-blue hover:bg-brand-blue/5"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "card"
                  ? "bg-brand-blue text-white shadow-2xs font-bold"
                  : "text-brand-blue hover:bg-brand-blue/5"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
          {/* Date Sort Toggle Button */}
          <button
            type="button"
            onClick={() => toggleSort("date")}
            title="Click to toggle Date sorting"
            className={`focus-visible:ring-brand-blue/25 flex items-center gap-2 rounded-full border py-2.5 px-4 text-xs font-semibold outline-none focus-visible:ring-[3px] transition-all cursor-pointer shadow-2xs shrink-0 ${
              activeSortBy === "date"
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-brand-blue bg-white text-brand-blue hover:bg-brand-blue/5"
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
            <span>
              Date: <strong className={activeSortBy === "date" ? "text-white font-bold" : "text-zinc-950 font-bold"}>{activeSortBy === "date" && sortDir === "asc" ? "Oldest First" : "Newest First"}</strong>
            </span>
          </button>

          {/* Priority Sort Toggle Button */}
          <button
            type="button"
            onClick={() => toggleSort("priority")}
            title="Click to toggle Priority sorting"
            className={`focus-visible:ring-brand-blue/25 flex items-center gap-2 rounded-full border py-2.5 px-4 text-xs font-semibold outline-none focus-visible:ring-[3px] transition-all cursor-pointer shadow-2xs shrink-0 ${
              activeSortBy === "priority"
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-brand-blue bg-white text-brand-blue hover:bg-brand-blue/5"
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
            <span>
              Priority: <strong className={activeSortBy === "priority" ? "text-white font-bold" : "text-zinc-950 font-bold"}>{activeSortBy === "priority" && sortDir === "asc" ? "Low First" : "Urgent First"}</strong>
            </span>
          </button>

          {/* Status Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              onBlur={() => setTimeout(() => setFilterOpen(false), 200)}
              className="focus-visible:ring-brand-blue/25 flex items-center justify-between gap-3 rounded-full border border-brand-blue bg-white py-2.5 pl-5 pr-4 text-sm font-semibold text-brand-blue outline-none focus-visible:ring-[3px] transition-shadow min-w-[180px] cursor-pointer"
            >
              <span>
                {PROCUREMENT_FILTERS.find((f) => f.value === filter)?.label || "All"}
              </span>
              <ChevronDown className="h-4 w-4 text-brand-blue" />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {PROCUREMENT_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 cursor-pointer ${
                      f.value === filter
                        ? "bg-zinc-50 font-semibold text-brand-blue"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    {f.value === "APPROVED" ? (
                      <CheckCircle
                        className={`w-4 h-4 ${
                          f.value === filter ? "text-emerald-500" : "text-emerald-500/70"
                        }`}
                      />
                    ) : f.value === "UNDER_REVIEW" ? (
                      <Clock
                        className={`w-4 h-4 ${
                          f.value === filter ? "text-amber-500" : "text-amber-500/70"
                        }`}
                      />
                    ) : f.value === "SUBMITTED" ? (
                      <FileCheck
                        className={`w-4 h-4 ${
                          f.value === filter ? "text-brand-blue" : "text-brand-blue/70"
                        }`}
                      />
                    ) : f.value === "REJECTED" ? (
                      <XCircle
                        className={`w-4 h-4 ${
                          f.value === filter ? "text-rose-500" : "text-rose-500/70"
                        }`}
                      />
                    ) : f.value === "REVISION_REQUESTED" ? (
                      <RotateCcw
                        className={`w-4 h-4 ${
                          f.value === filter ? "text-purple-500" : "text-purple-500/70"
                        }`}
                      />
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

      {/* Main Content: Table View OR Card Grid View */}
      {viewMode === "table" ? (
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-opacity duration-150 ${
            refreshing ? "opacity-70" : "opacity-100"
          }`}
          aria-busy={refreshing || initialLoad}
        >
          {/* Fixed Top Header */}
          <div className="shrink-0 bg-brand-blue text-white rounded-2xl px-6 py-3.5 shadow-xs mb-2">
            <div className="grid grid-cols-12 gap-3 items-center text-xs font-semibold">
              <div className="col-span-3 min-w-0">Reference & Title</div>
              <div
                className="col-span-1 min-w-0 flex items-center gap-1.5 cursor-pointer select-none hover:text-white/80 transition-colors"
                onClick={() => toggleSort("date")}
                title="Click to sort by Date (Newest / Oldest)"
              >
                <span>Date</span>
                {activeSortBy === "date" && (
                  sortDir === "desc" ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  )
                )}
              </div>
              <div className="col-span-2 min-w-0">Department</div>
              <div
                className="col-span-2 min-w-0 flex items-center justify-center gap-1.5 text-center cursor-pointer select-none hover:text-white/80 transition-colors"
                onClick={() => toggleSort("priority")}
                title="Click to sort by Priority (Urgent / Low)"
              >
                <span>Priority</span>
                {activeSortBy === "priority" && (
                  sortDir === "desc" ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  )
                )}
              </div>
              <div className="col-span-1 min-w-0">Requester</div>
              <div className="col-span-1 min-w-0">Est. Amount</div>
              <div className="col-span-1 min-w-0 text-center">Status</div>
              <div className="col-span-1 min-w-0 text-right">Actions</div>
            </div>
          </div>

          {/* Scrollable Rows */}
          <div
            data-lenis-prevent
            className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-2 pr-1"
          >
            {initialLoad && displayed.length === 0 && (
              <div className="px-6 py-10 text-center text-zinc-600">
                Loading procurement requisitions…
              </div>
            )}
            {!initialLoad && displayed.length === 0 && (
              <div className="px-6 py-10 text-center text-zinc-600">
                {`No requisitions${search ? ` matching "${search}"` : ""} in this view.`}
              </div>
            )}
            {displayed.map((r) => {
              const statusBadge = getStatusBadgeInfo(r.status);
              const priorityBadge = getPriorityBadgeInfo(r.priority);

              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/procurement/${r.id}`)}
                  className="grid grid-cols-12 gap-3 items-center group cursor-pointer bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl p-4 transition-all hover:ring-brand-blue/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] text-sm"
                >
                  {/* Reference & Title */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-brand-blue">
                        {r.referenceNumber}
                      </span>
                      <span className="text-sm font-semibold text-zinc-900 truncate group-hover:text-brand-blue transition-colors">
                        {r.title}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-1 min-w-0 text-xs font-medium text-zinc-600 truncate">
                    {formatDate(r.createdAt)}
                  </div>

                  {/* Department */}
                  <div className="col-span-2 min-w-0 text-xs font-semibold text-zinc-800 truncate">
                    {r.department}
                  </div>

                  {/* Priority */}
                  <div className="col-span-2 min-w-0 text-center">
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider min-w-[105px] ${priorityBadge.bgClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${priorityBadge.dotClass}`} />
                      <span>{priorityBadge.label}</span>
                    </span>
                  </div>

                  {/* Requester */}
                  <div className="col-span-1 min-w-0 text-xs font-medium text-zinc-600 truncate">
                    {r.requesterName}
                  </div>

                  {/* Est. Amount */}
                  <div className="col-span-1 min-w-0 text-sm font-bold text-zinc-950 font-mono truncate">
                    {formatCurrency(r.totalEstimatedAmount, r.currency)}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 min-w-0 text-center">
                    <span
                      className={`inline-flex justify-center items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold truncate ${statusBadge.bgClass}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 min-w-0 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/procurement/${r.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-brand-blue bg-white px-3 py-1 text-xs font-semibold text-brand-blue shadow-2xs group-hover:bg-brand-blue group-hover:text-white transition-all cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Card Design Grid View - Scrollable */
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1 pb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialLoad && displayed.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500">
                Loading procurement requisitions...
              </div>
            )}
            {!initialLoad && displayed.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-200 p-8">
                <p className="text-sm font-semibold text-zinc-700">No requisitions found</p>
                <p className="text-xs text-zinc-400 mt-1">Try adjusting your search query or filters.</p>
              </div>
            )}
            {displayed.map((r) => {
              const statusBadge = getStatusBadgeInfo(r.status);
              const priorityBadge = getPriorityBadgeInfo(r.priority);

              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/procurement/${r.id}`)}
                  className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs hover:border-brand-blue/60 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="space-y-3.5">
                    {/* Top Meta: Ref + Status Capsule + Priority */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-md">
                        {r.referenceNumber}
                      </span>
                      <span
                        className={`inline-flex justify-center items-center rounded-full border px-3 py-0.5 text-[11px] font-semibold whitespace-nowrap min-w-[115px] ${statusBadge.bgClass}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-zinc-950 group-hover:text-brand-blue transition-colors line-clamp-1">
                        {r.title}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                    </div>

                    {/* Details summary */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5" />
                          Department:
                        </span>
                        <span className="font-semibold text-zinc-800 truncate max-w-[160px]">
                          {r.department}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Requester:
                        </span>
                        <span className="font-semibold text-zinc-800 truncate max-w-[160px]">
                          {r.requesterName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Required Date:
                        </span>
                        <span className="font-semibold text-zinc-800">{formatDate(r.requiredByDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer: Amount & Action Link (Button activates on card hover) */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        Est. Total Amount
                      </span>
                      <p className="text-lg font-extrabold text-zinc-950 tabular-nums">
                        {formatCurrency(r.totalEstimatedAmount, r.currency)}
                      </p>
                    </div>

                    <Link
                      href={`/procurement/${r.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue bg-white px-4 py-1.5 text-xs font-semibold text-brand-blue shadow-2xs group-hover:bg-brand-blue group-hover:text-white transition-all"
                    >
                      <span>Details</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export function ProcurementSkeleton() {
  return (
    <div className="flex flex-1 flex-col min-h-0 w-full animate-pulse space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-100 rounded-3xl" />
        ))}
      </div>
      <div className="h-12 bg-zinc-100 rounded-full" />
      <div className="h-96 bg-zinc-100 rounded-3xl" />
    </div>
  );
}
