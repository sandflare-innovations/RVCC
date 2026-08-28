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
} from "lucide-react";

import { AnimatedSearchInput } from "@/lib/ui";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import { AdminProcurementStore } from "@/lib/procurement/storage";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/procurement/formatters";

type ProcurementFilterValue = "ALL" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";

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
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [allRows, setAllRows] = useState<PurchaseRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [, startTransition] = useTransition();

  const loadData = useCallback(() => {
    setRefreshing(true);
    const data = AdminProcurementStore.getRequests();
    setAllRows(data);
    setInitialLoad(false);
    setTimeout(() => setRefreshing(false), 250);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metrics for Top 4 Cards (exact admin panel theme)
  const metrics = useMemo(() => {
    const total = allRows.length;
    const approved = allRows.filter((r) => r.status === "approved").length;
    const underReview = allRows.filter((r) => r.status === "under_review" || r.status === "submitted").length;
    const rejected = allRows.filter((r) => r.status === "rejected").length;
    return { total, approved, underReview, rejected };
  }, [allRows]);

  // Filter & Search Logic
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
          r.requesterName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return sortDir === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [allRows, filter, search, sortDir]);

  const applyFilter = (next: ProcurementFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
    });
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full">
      {/* KPI 4 Cards with exact admin UI aesthetics */}
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
            className={`group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border bg-white p-4 cursor-pointer shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
              filter === card.filterVal ? "border-brand-blue ring-1 ring-brand-blue" : "border-zinc-200"
            }`}
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

      {/* Action Bar (Search + Filter dropdown + Refresh) */}
      <div className="flex flex-nowrap items-center justify-between gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <button
            type="button"
            onClick={() => loadData()}
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
                      <CheckCircle className={`w-4 h-4 ${f.value === filter ? "text-emerald-500" : "text-emerald-500/70"}`} />
                    ) : f.value === "UNDER_REVIEW" ? (
                      <Clock className={`w-4 h-4 ${f.value === filter ? "text-amber-500" : "text-amber-500/70"}`} />
                    ) : f.value === "SUBMITTED" ? (
                      <FileCheck className={`w-4 h-4 ${f.value === filter ? "text-brand-blue" : "text-brand-blue/70"}`} />
                    ) : f.value === "REJECTED" ? (
                      <XCircle className={`w-4 h-4 ${f.value === filter ? "text-rose-500" : "text-rose-500/70"}`} />
                    ) : f.value === "REVISION_REQUESTED" ? (
                      <RotateCcw className={`w-4 h-4 ${f.value === filter ? "text-purple-500" : "text-purple-500/70"}`} />
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

      {/* Styled Admin Data Table with Brand Blue Header */}
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-opacity duration-150 ${
          refreshing ? "opacity-70" : "opacity-100"
        }`}
        aria-busy={refreshing || initialLoad}
      >
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-white">
                <th className="sticky top-0 left-0 z-40 whitespace-nowrap rounded-l-2xl bg-brand-blue px-6 py-3.5 font-semibold">
                  Reference & Title
                </th>
                <th
                  className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-6 py-3.5 font-semibold cursor-pointer select-none hover:bg-brand-blue/90 transition-colors"
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  title="Toggle sort by date"
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    {sortDir === "desc" ? (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </div>
                </th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-6 py-3.5 font-semibold">
                  Department
                </th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-6 py-3.5 font-semibold">
                  Requester
                </th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-6 py-3.5 font-semibold">
                  Est. Amount
                </th>
                <th className="sticky top-0 z-30 whitespace-nowrap bg-brand-blue px-6 py-3.5 font-semibold">
                  Status
                </th>
                <th className="sticky top-0 right-0 z-40 whitespace-nowrap rounded-r-2xl bg-brand-blue px-6 py-3.5 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {initialLoad && displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-zinc-600">
                    Loading procurement requisitions…
                  </td>
                </tr>
              )}
              {!initialLoad && displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-zinc-600">
                    {`No requisitions${search ? ` matching "${search}"` : ""} in this view.`}
                  </td>
                </tr>
              )}
              {displayed.map((r) => {
                const statusBadge = getStatusBadgeInfo(r.status);
                const priorityBadge = getPriorityBadgeInfo(r.priority);

                return (
                  <tr
                    key={r.id}
                    className="group cursor-pointer bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl transition-all hover:ring-brand-blue/40"
                    onClick={() => router.push(`/procurement/${r.id}`)}
                  >
                    {/* Fixed First Column: Reference and Title */}
                    <td className="sticky left-0 z-10 whitespace-nowrap rounded-l-2xl bg-white py-4 pl-6 pr-4 font-medium text-zinc-950 ring-1 ring-inset ring-zinc-100 group-hover:ring-brand-blue/40">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-brand-blue">
                          {r.referenceNumber}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 line-clamp-1 max-w-xs group-hover:text-brand-blue transition-colors">
                          {r.title}
                        </span>
                      </div>
                    </td>


                    {/* Date */}
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-zinc-600">
                      {formatDate(r.createdAt)}
                    </td>

                    {/* Department */}
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-zinc-800">
                      {r.department}
                    </td>

                    {/* Requester */}
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-zinc-600">
                      {r.requesterName}
                    </td>

                    {/* Estimated Amount */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-zinc-950 tabular-nums">
                      {formatCurrency(r.totalEstimatedAmount, r.currency)}
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="whitespace-nowrap rounded-r-2xl py-4 pl-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/procurement/${r.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand-blue bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-blue shadow-2xs hover:bg-brand-blue hover:text-white transition-all cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
