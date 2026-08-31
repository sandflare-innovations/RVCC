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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shadow-xs">
        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
        Won / Awarded
      </span>
    );
  }

  if (row.endedStatus === "UNDER_EVALUATION") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
        <Clock className="h-3.5 w-3.5 text-amber-600" />
        Under Evaluation
      </span>
    );
  }

  if (row.endedStatus === "LOST") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
        Not Awarded
      </span>
    );
  }

  if (row.endedStatus === "CANCELLED" || row.status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5 text-red-500" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
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
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Sourcing & Bids Workbench
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            View all invited RFQs, participate in live blind bidding, monitor L1 ranks, and track ended bid outcomes.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {[
          {
            id: "all",
            label: "Total RFQs",
            count: counts.all,
            icon: <Layers className="h-4 w-4 text-brand-blue" />,
            bg: "bg-blue-50/60 border-blue-100",
          },
          {
            id: "running",
            label: "Running / Live",
            count: counts.running,
            icon: <Flame className="h-4 w-4 text-amber-500" />,
            bg: "bg-amber-50/60 border-amber-100",
          },
          {
            id: "invited",
            label: "Action Required",
            count: counts.invited,
            icon: <Inbox className="h-4 w-4 text-blue-500" />,
            bg: "bg-sky-50/60 border-sky-100",
          },
          {
            id: "submitted",
            label: "Submitted Bids",
            count: counts.submitted,
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            bg: "bg-emerald-50/60 border-emerald-100",
          },
          {
            id: "ended",
            label: "Ended Bids",
            count: counts.ended,
            icon: <History className="h-4 w-4 text-indigo-500" />,
            bg: "bg-indigo-50/60 border-indigo-100",
          },
          {
            id: "drafts",
            label: "Saved Drafts",
            count: counts.drafts,
            icon: <FileText className="h-4 w-4 text-purple-500" />,
            bg: "bg-purple-50/60 border-purple-100",
          },
        ].map((kpi) => (
          <button
            key={kpi.id}
            type="button"
            onClick={() => setActiveTab(kpi.id as TabType)}
            className={cn(
              "flex flex-col items-start rounded-2xl border p-4 text-left transition-all",
              kpi.bg,
              activeTab === kpi.id
                ? "border-brand-blue ring-2 ring-brand-blue/30 shadow-sm"
                : "hover:border-zinc-300"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-semibold text-zinc-600">{kpi.label}</span>
              {kpi.icon}
            </div>
            <span className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
              {kpi.count}
            </span>
          </button>
        ))}
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200 bg-zinc-100/70 p-1.5 text-xs font-bold">
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
                "flex items-center gap-2 rounded-xl px-3 py-2 transition-all",
                activeTab === tab.id
                  ? "bg-white text-brand-blue shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  activeTab === tab.id
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "bg-zinc-200 text-zinc-600"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search project or RFQ #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2 pr-4 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Empty State */}
      {displayedRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-blue mb-4">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {searchQuery ? "No matching tenders found" : "No tenders in this category"}
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-zinc-500">
            {searchQuery
              ? `No RFQs matching "${searchQuery}". Try searching with a different keyword or project title.`
              : "When RFQs are published, invited, or concluded, they will appear in this workbench."}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition-colors"
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
                  className={cn(
                    "rounded-2xl border bg-white p-5 shadow-sm transition-all",
                    row.isEnded
                      ? "border-zinc-200 bg-zinc-50/40"
                      : deadline.urgent && !isSubmitted
                        ? "border-amber-300 ring-1 ring-amber-300"
                        : "border-zinc-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-semibold text-zinc-500">
                        {row.referenceNumber ?? "RFQ-PENDING"}
                      </span>
                      <h3 className="mt-0.5 text-base font-bold text-zinc-900">{row.project}</h3>
                    </div>
                    {row.isEnded ? (
                      <EndedStatusBadge row={row} />
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                      </span>
                    ) : isDraft ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                        <FileText className="h-3.5 w-3.5" /> Draft Saved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-blue">
                        <Sparkles className="h-3.5 w-3.5" /> Action Required
                      </span>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs text-zinc-600 leading-relaxed">
                    {row.scopeOfWork}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span className={deadline.urgent && !row.isEnded ? "font-bold text-amber-600" : ""}>
                        {row.isEnded ? "Bidding Concluded" : deadline.label}
                      </span>
                    </div>

                    {row.newPrice && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">
                          {Number(row.newPrice).toLocaleString()} {row.currency || "SAR"}
                        </span>
                        {!row.isEnded && <LiveRankBadge requirementId={row.id} />}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/requirements/${row.id}`}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all",
                        row.isEnded
                          ? "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                          : isSubmitted
                            ? "border border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                            : "bg-brand-blue text-white hover:bg-brand-blue/90 shadow-sm"
                      )}
                    >
                      <span>{row.isEnded ? "View Outcome & Details" : isSubmitted ? "View / Revise Bid" : isDraft ? "Resume Quote" : "Enter Bid Cockpit"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (lg:block) */}
          <div className="hidden overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-bold tracking-wider text-zinc-600 uppercase">
                <tr>
                  <th className="px-6 py-4">Tender / Project</th>
                  <th className="px-6 py-4">Reference #</th>
                  <th className="px-6 py-4">Status / Deadline</th>
                  <th className="px-6 py-4">Your Quote & Ranking</th>
                  <th className="px-6 py-4 text-right">Action</th>
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
                      className={cn(
                        "group transition-colors hover:bg-blue-50/30",
                        row.isEnded && "bg-zinc-50/30"
                      )}
                    >
                      {/* Project & Scope */}
                      <td className="px-6 py-4 max-w-sm">
                        <Link
                          href={`/requirements/${row.id}`}
                          className="font-bold text-zinc-950 group-hover:text-brand-blue transition-colors flex items-center gap-1.5"
                        >
                          <span>{row.project}</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                          {row.scopeOfWork}
                        </p>
                      </td>

                      {/* Reference # */}
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-600">
                        {row.referenceNumber ?? "—"}
                      </td>

                      {/* Status / Deadline */}
                      <td className="px-6 py-4">
                        {row.isEnded ? (
                          <EndedStatusBadge row={row} />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Clock className={cn("h-3.5 w-3.5", deadline.urgent ? "text-amber-500" : "text-zinc-400")} />
                            <span
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
                      <td className="px-6 py-4">
                        {row.isEnded ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-950">
                              {row.newPrice ? `${Number(row.newPrice).toLocaleString()} ${row.currency || "SAR"}` : "No Quote Submitted"}
                            </span>
                          </div>
                        ) : isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-950">
                              {row.newPrice ? `${Number(row.newPrice).toLocaleString()} ${row.currency || "SAR"}` : "Submitted"}
                            </span>
                            <LiveRankBadge requirementId={row.id} />
                          </div>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                            <FileText className="h-3 w-3" /> Draft saved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-brand-blue">
                            <Sparkles className="h-3 w-3" /> Action Required
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/requirements/${row.id}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                            row.isEnded
                              ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                              : isSubmitted
                                ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
                                : "bg-brand-blue text-white hover:bg-brand-blue/90 shadow-sm"
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
