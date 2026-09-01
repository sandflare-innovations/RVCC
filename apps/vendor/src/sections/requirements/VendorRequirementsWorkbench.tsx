"use client";

import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  History,
  Inbox,
  Layers,
  Search,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { describeDeadline, type VendorRequirementRow } from "@/lib/rfq";
import { cn } from "@/lib/utils";
import { LiveRankBadge } from "@/sections/requirements/LiveRankBadge";

export type RequirementRow = VendorRequirementRow;

type TabType = "all" | "running" | "invited" | "submitted" | "ended" | "drafts";

export function EndedStatusBadge({ row }: { row: RequirementRow }) {
  if (!row.isEnded && row.status === "OPEN") return null;

  if (row.isAwardedToMe || row.endedStatus === "WON") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
        <Trophy className="h-3.5 w-3.5" />
        Won / Awarded
      </span>
    );
  }

  if (row.endedStatus === "UNDER_EVALUATION") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
        <Clock className="h-3.5 w-3.5 text-amber-600" />
        Under Evaluation
      </span>
    );
  }

  if (row.endedStatus === "LOST") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
        Not Awarded
      </span>
    );
  }

  if (row.endedStatus === "CANCELLED" || row.status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5 text-red-500" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
      Closed
    </span>
  );
}

export function VendorRequirementsWorkbench({ initialRows }: { initialRows: RequirementRow[] }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;
  const initialTab = tabParam || "all";
  const initialSearch = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [rows, setRows] = useState<RequirementRow[]>(initialRows || []);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (initialRows?.length) {
      setRows(initialRows);
    }
  }, [initialRows]);

  // Sync workbench on mount and when user switches back to tab
  useEffect(() => {
    const fetchLatest = () => {
      fetch("/api/requirements", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.requirements)
              ? data.requirements
              : [];
          if (list.length > 0) {
            setRows(list);
          }
        })
        .catch(() => {});
    };

    fetchLatest();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Categorize rows
  const runningRows = useMemo(() => {
    return rows.filter((r) => {
      const isPast = new Date(r.closesAt).getTime() <= Date.now();
      return !isPast && !r.isEnded && r.status === "OPEN";
    });
  }, [rows]);

  const invitedRows = useMemo(() => {
    return rows.filter((r) => (!r.quoteStatus || r.quoteStatus === null) && !r.isEnded && r.status === "OPEN");
  }, [rows]);

  const submittedRows = useMemo(() => {
    return rows.filter((r) => r.quoteStatus === "SUBMITTED");
  }, [rows]);

  const endedRows = useMemo(() => {
    return rows.filter((r) => r.isEnded || r.status === "AWARDED" || r.status === "CLOSED");
  }, [rows]);

  const draftRows = useMemo(() => {
    return rows.filter((r) => r.quoteStatus === "DRAFT" && !r.isEnded);
  }, [rows]);

  // Active filter tab selection
  const tabFilteredRows = useMemo(() => {
    switch (activeTab) {
      case "running":
        return runningRows;
      case "invited":
        return invitedRows;
      case "submitted":
        return submittedRows;
      case "ended":
        return endedRows;
      case "drafts":
        return draftRows;
      case "all":
      default:
        return rows;
    }
  }, [activeTab, rows, runningRows, invitedRows, submittedRows, endedRows, draftRows]);

  // Search filter
  const displayedRows = useMemo(() => {
    if (!searchQuery.trim()) return tabFilteredRows;
    const q = searchQuery.toLowerCase().trim();
    return tabFilteredRows.filter((r) => {
      return (
        r.project?.toLowerCase().includes(q) ||
        r.referenceNumber?.toLowerCase().includes(q) ||
        r.scopeOfWork?.toLowerCase().includes(q)
      );
    });
  }, [tabFilteredRows, searchQuery]);

  const counts = {
    all: rows.length,
    running: runningRows.length,
    invited: invitedRows.length,
    submitted: submittedRows.length,
    ended: endedRows.length,
    drafts: draftRows.length,
  };

  return (
    <div className="space-y-8">
      {/* 1. Admin-Style Elevated KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            id: "all",
            label: "Total RFQs",
            count: counts.all,
            icon: <Layers className="h-4 w-4" />,
          },
          {
            id: "running",
            label: "Running / Live",
            count: counts.running,
            icon: <Flame className="h-4 w-4" />,
          },
          {
            id: "invited",
            label: "Action Required",
            count: counts.invited,
            icon: <Inbox className="h-4 w-4" />,
          },
          {
            id: "submitted",
            label: "Submitted Bids",
            count: counts.submitted,
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            id: "ended",
            label: "Ended Bids",
            count: counts.ended,
            icon: <History className="h-4 w-4" />,
          },
          {
            id: "drafts",
            label: "Saved Drafts",
            count: counts.drafts,
            icon: <FileText className="h-4 w-4" />,
          },
        ].map((kpi) => (
          <button
            key={kpi.id}
            type="button"
            onClick={() => setActiveTab(kpi.id as TabType)}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-5 text-left shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,115,188,0.12)]",
              activeTab === kpi.id ? "ring-2 ring-brand-blue/30 bg-brand-blue/5" : ""
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase truncate">
                {kpi.label}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                {kpi.icon}
              </div>
            </div>
            <span className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 tabular-nums">
              {kpi.count}
            </span>
          </button>
        ))}
      </div>

      {/* 2. Control Bar: Elevated Filter Tabs & Live Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs Container */}
        <div className="flex flex-wrap gap-1 rounded-2xl bg-white p-1.5 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.06)]">
          {[
            { id: "all", label: "All Bids", count: counts.all },
            { id: "running", label: "Running Bids", count: counts.running },
            { id: "invited", label: "Action Required", count: counts.invited },
            { id: "submitted", label: "Submitted", count: counts.submitted },
            { id: "ended", label: "Ended Bids", count: counts.ended },
            { id: "drafts", label: "Drafts", count: counts.drafts },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                activeTab === tab.id
                  ? "bg-brand-blue text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums font-bold",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 text-zinc-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search project or RFQ #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200/80 bg-white py-2.5 pr-4 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_8px_24px_-8px_rgba(15,23,42,0.06)] focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* 3. Content: Empty State or Admin-Style Data Table */}
      {displayedRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-14 text-center shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue mb-4">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-950">
            {searchQuery ? "No matching tenders found" : "No tenders in this category"}
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-zinc-400">
            {searchQuery
              ? `No RFQs matching "${searchQuery}". Try searching with a different keyword or project title.`
              : "When RFQs are published, invited, or concluded, they will appear in this workbench."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-5 rounded-2xl bg-zinc-100 px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card List (hidden on lg) */}
          <div className="space-y-4 lg:hidden">
            {displayedRows.map((row) => {
              const deadline = describeDeadline(row.closesAt);
              const isSubmitted = row.quoteStatus === "SUBMITTED";
              const isDraft = row.quoteStatus === "DRAFT";

              return (
                <div
                  key={row.id}
                  className="rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] transition-all hover:shadow-[0_8px_28px_rgba(0,115,188,0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                        {row.referenceNumber ?? "RFQ-PENDING"}
                      </span>
                      <h3 className="mt-2 text-base font-bold text-zinc-950">{row.project}</h3>
                    </div>
                    {row.isEnded ? (
                      <EndedStatusBadge row={row} />
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                      </span>
                    ) : isDraft ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                        <FileText className="h-3.5 w-3.5" /> Draft Saved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
                        <Sparkles className="h-3.5 w-3.5" /> Action Required
                      </span>
                    )}
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs text-zinc-500 leading-relaxed">
                    {row.scopeOfWork}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3.5 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className={deadline.urgent && !row.isEnded ? "font-bold text-amber-600" : ""}>
                        {row.isEnded ? "Bidding Concluded" : deadline.label}
                      </span>
                    </div>

                    {row.newPrice && (
                      <div className="flex items-center gap-2">
                        <span suppressHydrationWarning className="font-bold text-zinc-950 tabular-nums">
                          {Number(row.newPrice).toLocaleString("en-US")} {row.currency || "SAR"}
                        </span>
                        {!row.isEnded && <LiveRankBadge requirementId={row.id} />}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/requirements/${row.id}`}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all",
                        row.isEnded || isSubmitted
                          ? "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                          : "bg-brand-blue text-white hover:opacity-90 shadow-[0_4px_16px_rgba(0,115,188,0.25)]"
                      )}
                    >
                      <span>{row.isEnded ? "View Outcome & Details" : isSubmitted ? "View / Revise Bid" : isDraft ? "Resume Quote" : "Enter Bid Workspace"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Admin-Style Borderless Elevated Table) */}
          <div className="hidden overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                <tr>
                  <th className="px-6 py-4.5">Tender / Project</th>
                  <th className="px-6 py-4.5">Reference #</th>
                  <th className="px-6 py-4.5">Status / Deadline</th>
                  <th className="px-6 py-4.5">Your Bid & Standing</th>
                  <th className="px-6 py-4.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayedRows.map((row) => {
                  const deadline = describeDeadline(row.closesAt);
                  const isSubmitted = row.quoteStatus === "SUBMITTED";
                  const isDraft = row.quoteStatus === "DRAFT";

                  return (
                    <tr
                      key={row.id}
                      className="group transition-colors hover:bg-zinc-50/60"
                    >
                      {/* Project & Scope */}
                      <td className="px-6 py-4.5 max-w-sm">
                        <Link
                          href={`/requirements/${row.id}`}
                          className="font-bold text-zinc-950 group-hover:text-brand-blue transition-colors flex items-center gap-1.5"
                        >
                          <span>{row.project}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">
                          {row.scopeOfWork}
                        </p>
                      </td>

                      {/* Reference # */}
                      <td className="px-6 py-4.5">
                        <span className="font-mono rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                          {row.referenceNumber ?? "—"}
                        </span>
                      </td>

                      {/* Status / Deadline */}
                      <td className="px-6 py-4.5">
                        {row.isEnded ? (
                          <EndedStatusBadge row={row} />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className={cn("h-3.5 w-3.5", deadline.urgent ? "text-amber-500" : "text-zinc-400")} />
                            <span
                              suppressHydrationWarning
                              className={cn(
                                "text-xs font-medium",
                                deadline.urgent ? "font-bold text-amber-600" : "text-zinc-700"
                              )}
                            >
                              {deadline.label}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Your Quote & Ranking */}
                      <td className="px-6 py-4.5">
                        {row.isEnded ? (
                          <div className="flex items-center gap-2">
                            <span suppressHydrationWarning className="font-bold text-zinc-950 tabular-nums">
                              {row.newPrice ? `${Number(row.newPrice).toLocaleString("en-US")} ${row.currency || "SAR"}` : "No Quote Submitted"}
                            </span>
                          </div>
                        ) : isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <span suppressHydrationWarning className="font-bold text-zinc-950 tabular-nums">
                              {row.newPrice ? `${Number(row.newPrice).toLocaleString("en-US")} ${row.currency || "SAR"}` : "Submitted"}
                            </span>
                            <LiveRankBadge requirementId={row.id} />
                          </div>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                            <FileText className="h-3 w-3" /> Draft saved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
                            <Sparkles className="h-3 w-3" /> Action Required
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4.5 text-right">
                        <Link
                          href={`/requirements/${row.id}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                            row.isEnded || isSubmitted
                              ? "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
                              : "bg-brand-blue text-white hover:opacity-90 shadow-xs"
                          )}
                        >
                          <span>{row.isEnded ? "View Details" : isSubmitted ? "View / Revise" : isDraft ? "Resume" : "Bid Now"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
