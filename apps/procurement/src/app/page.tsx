"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  ChevronDown,
  Paperclip,
  Inbox,
  ArrowUpRight,
  Plus,
  Table as TableIcon,
  LayoutGrid,
  Calendar,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { MetricsOverview } from "@/components/dashboard/metrics-overview";
import { NewRequestModal } from "@/components/requests/new-request-modal";
import { PurchaseRequest, ProcurementStats } from "@/types/procurement";
import { ProcurementStore } from "@/lib/storage";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/formatters";
import { AnimatedSearchInput } from "@/components/ui/animated-search-input";

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "revision_requested", label: "Revision Requested" },
];

const DEPARTMENT_FILTERS = [
  { value: "all", label: "All Trades / Departments" },
  { value: "Civil & Structural Engineering", label: "Civil & Structural" },
  { value: "MEP & Electrical Systems", label: "MEP & Electrical" },
  { value: "Heavy Plant & Machinery", label: "Heavy Plant & Equipment" },
  { value: "Architecture & Finishes", label: "Architecture & Finishes" },
  { value: "Site Safety & HSE", label: "Site Safety & HSE" },
  { value: "Infrastructure & Earthworks", label: "Infrastructure & Earthworks" },
];

const SEARCH_PLACEHOLDERS = [
  "reference (e.g. PR-2026-001)...",
  "materials (Concrete, Rebar, Cable)...",
  "specification or package...",
  "trade or department...",
];

export default function RequesterDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const loadData = () => {
    setIsRefreshing(true);
    const data = ProcurementStore.getRequests();
    setRequests(data);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = (newReqData: any) => {
    const created = ProcurementStore.addRequest(newReqData);
    loadData();
    router.push(`/requirements/${created.id}`);
  };

  // Calculate metrics
  const stats: ProcurementStats = {
    totalRequests: requests.length,
    pendingReviewCount: requests.filter(
      (r) => r.status === "submitted" || r.status === "under_review"
    ).length,
    approvedCount: requests.filter((r) => r.status === "approved").length,
    rejectedCount: requests.filter((r) => r.status === "rejected").length,
    totalEstimatedSpend: requests.reduce((sum, r) => sum + r.totalEstimatedAmount, 0),
    urgentCount: requests.filter((r) => r.priority === "urgent").length,
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesDept =
      departmentFilter === "all" || req.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 text-zinc-900">
      {/* Sticky Header / Navbar */}
      <div className="shrink-0 z-30">
        <Navbar
          onOpenNewRequest={() => setIsModalOpen(true)}
          onRefreshData={loadData}
        />
      </div>

      {/* Main Container: Centered Layout with Balanced 100vh */}
      <main className="mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 pt-4 pb-4 flex-1 flex flex-col min-h-0 gap-3">
        {/* Compact KPI Metrics Overview */}
        <div className="shrink-0">
          <MetricsOverview stats={stats} />
        </div>

        {/* Toolbar: Refresh, Animated Search, Filters & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Refresh Button + Animated Search Input */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              title="Refresh table data"
              aria-label="Refresh requisitions table"
              className="inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-[#0073bc] bg-white text-[#0073bc] transition-all hover:bg-[#0073bc]/5 active:scale-95 disabled:opacity-50 focus-visible:ring-[3px] focus-visible:ring-[#0073bc]/25 focus-visible:outline-none cursor-pointer shadow-xs"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-[#0073bc]" : ""}`}
                aria-hidden
              />
            </button>

            <AnimatedSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholders={SEARCH_PLACEHOLDERS}
              ariaLabel="Search requisitions"
            />
          </div>

          {/* Right: Filters + View Mode Toggle + New Requisition Button */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Table / Card View Switcher */}
            <div className="flex items-center rounded-full border border-zinc-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Table View"
                className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#0073bc] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Card View"
                className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#0073bc] text-white shadow-xs"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
            </div>

            {/* Status Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen((prev) => !prev);
                  setDeptDropdownOpen(false);
                }}
                onBlur={() => setTimeout(() => setStatusDropdownOpen(false), 200)}
                className="focus-visible:ring-[#0073bc]/25 flex items-center justify-between gap-2 rounded-full border border-[#0073bc] bg-white py-2 pl-3.5 pr-3 text-xs font-semibold text-[#0073bc] outline-none focus-visible:ring-[3px] transition-all shadow-xs cursor-pointer min-w-[130px]"
              >
                <span>
                  {STATUS_FILTERS.find((f) => f.value === statusFilter)?.label || "All Statuses"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#0073bc] transition-transform duration-200 ${
                    statusDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setStatusFilter(f.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${
                        f.value === statusFilter
                          ? "bg-zinc-50 font-bold text-[#0073bc]"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Department Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDeptDropdownOpen((prev) => !prev);
                  setStatusDropdownOpen(false);
                }}
                onBlur={() => setTimeout(() => setDeptDropdownOpen(false), 200)}
                className="focus-visible:ring-[#0073bc]/25 flex items-center justify-between gap-2 rounded-full border border-[#0073bc] bg-white py-2 pl-3.5 pr-3 text-xs font-semibold text-[#0073bc] outline-none focus-visible:ring-[3px] transition-all shadow-xs cursor-pointer min-w-[150px]"
              >
                <span className="truncate max-w-[140px]">
                  {DEPARTMENT_FILTERS.find((f) => f.value === departmentFilter)?.label ||
                    "All Trades"}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#0073bc] shrink-0 transition-transform duration-200 ${
                    deptDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {deptDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  {DEPARTMENT_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setDepartmentFilter(f.value);
                        setDeptDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer truncate ${
                        f.value === departmentFilter
                          ? "bg-zinc-50 font-bold text-[#0073bc]"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Create Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0073bc] hover:bg-[#005f9e] inline-flex h-[38px] items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New Requisition
            </button>
          </div>
        </div>

        {/* Content View: Table or Grid (Fills remaining 100vh height with fluid width & internal scrolling) */}
        <div className="flex-1 min-h-0 flex flex-col rounded-3xl border border-zinc-100/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] overflow-hidden">
          {viewMode === "table" ? (
            /* Fluid Full-Width Table with Sticky Header & Smooth Horizontal / Vertical Scroll */
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-y-2.5 min-w-[980px]">
                <thead className="sticky top-0 z-30 bg-[#0073bc] text-white">
                  <tr className="whitespace-nowrap text-xs font-bold uppercase tracking-wider">
                    <th className="sticky left-0 z-40 bg-[#0073bc] px-6 py-3.5 rounded-l-2xl shadow-[2px_0_5px_rgba(0,0,0,0.08)]">
                      Requisition
                    </th>
                    <th className="bg-[#0073bc] px-5 py-3.5">Department / Trade</th>
                    <th className="bg-[#0073bc] px-5 py-3.5">Priority</th>
                    <th className="bg-[#0073bc] px-5 py-3.5">Status</th>
                    <th className="bg-[#0073bc] px-5 py-3.5 text-right">
                      Estimated Amount
                    </th>
                    <th className="bg-[#0073bc] px-5 py-3.5">Required By</th>
                    <th className="sticky right-0 z-40 bg-[#0073bc] px-6 py-3.5 text-right rounded-r-2xl shadow-[-2px_0_5px_rgba(0,0,0,0.08)]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => {
                      const statusBadge = getStatusBadgeInfo(req.status);
                      const priorityBadge = getPriorityBadgeInfo(req.priority);

                      return (
                        <tr
                          key={req.id}
                          onClick={() => router.push(`/requirements/${req.id}`)}
                          className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl transition-all hover:ring-[#0073bc]/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] group cursor-pointer whitespace-nowrap"
                        >
                          <td className="sticky left-0 z-20 bg-white group-hover:bg-zinc-50/90 transition-colors px-6 py-4 font-medium text-zinc-900 rounded-l-2xl shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[300px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0073bc] bg-[#0073bc]/10 px-2.5 py-0.5 rounded-lg">
                                {req.referenceNumber}
                              </span>
                              {req.attachments.length > 0 && (
                                <span
                                  title={`${req.attachments.length} attachments`}
                                  className="flex items-center text-zinc-400 gap-0.5 text-xs"
                                >
                                  <Paperclip className="h-3.5 w-3.5" />
                                  <span className="font-semibold">{req.attachments.length}</span>
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-zinc-950 group-hover:text-[#0073bc] transition-colors mt-1 max-w-[340px] truncate text-sm">
                              {req.title}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-zinc-700 text-sm font-medium">
                            {req.department}
                          </td>

                          <td className="px-5 py-4 text-xs">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                            >
                              {priorityBadge.label}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-xs">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`}
                              />
                              {statusBadge.label}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="font-extrabold text-zinc-950 font-mono text-base">
                              {formatCurrency(req.totalEstimatedAmount, req.currency)}
                            </div>
                            <div className="text-xs text-zinc-400 font-medium">
                              {req.items.length} {req.items.length === 1 ? "BOQ item" : "BOQ items"}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-zinc-600 text-xs">
                            <div className="font-bold text-zinc-900 text-sm">
                              {formatDate(req.requiredByDate)}
                            </div>
                            <div className="text-xs text-zinc-400">
                              Sub. {formatDate(req.createdAt)}
                            </div>
                          </td>

                          <td className="sticky right-0 z-20 bg-white group-hover:bg-zinc-50/90 transition-colors px-6 py-4 text-right rounded-r-2xl shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                            <Link
                              href={`/requirements/${req.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 group-hover:border-[#0073bc] group-hover:bg-[#0073bc] group-hover:text-white transition-all shadow-2xs"
                            >
                              View <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-zinc-500">
                        <div className="flex flex-col items-center justify-center">
                          <Inbox className="h-10 w-10 text-zinc-300 mb-2" />
                          <p className="text-base font-bold text-zinc-800">No requisitions found</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Try adjusting your filters or search query.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card Grid View (Scrolls smoothly in remaining height) */
            <div className="flex-1 min-h-0 overflow-y-auto p-2 no-scrollbar">
              {filteredRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredRequests.map((req) => {
                    const statusBadge = getStatusBadgeInfo(req.status);
                    const priorityBadge = getPriorityBadgeInfo(req.priority);

                    return (
                      <div
                        key={req.id}
                        onClick={() => router.push(`/requirements/${req.id}`)}
                        className="group flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_2px_14px_-4px_rgba(15,23,42,0.06)] hover:border-[#0073bc]/60 hover:shadow-[0_14px_36px_-8px_rgba(0,115,188,0.22)] transition-all cursor-pointer"
                      >
                        <div className="space-y-3.5">
                          {/* Card Top Meta */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#0073bc] bg-[#0073bc]/10 px-3 py-1 rounded-xl">
                                {req.referenceNumber}
                              </span>
                              {req.attachments.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-zinc-400 font-medium">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {req.attachments.length}
                                </span>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                              {statusBadge.label}
                            </span>
                          </div>

                          {/* Title & Trade */}
                          <div>
                            <h3 className="font-bold text-zinc-950 text-base sm:text-lg leading-snug group-hover:text-[#0073bc] transition-colors line-clamp-2">
                              {req.title}
                            </h3>
                            <p className="text-xs text-zinc-500 font-semibold mt-1">
                              {req.department}
                            </p>
                          </div>

                          {/* Priority & Required Date */}
                          <div className="flex items-center justify-between text-xs pt-3.5 border-t border-zinc-100 text-zinc-600">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold border ${priorityBadge.bgClass} ${priorityBadge.textClass} ${priorityBadge.borderClass}`}
                            >
                              {priorityBadge.label} Priority
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                              <Calendar className="h-4 w-4 text-zinc-400" />
                              Required: <strong className="text-zinc-900">{formatDate(req.requiredByDate)}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Card Bottom: Total Price + Action */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100">
                          <div>
                            <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-400 block">
                              Total Est. BOQ ({req.items.length} {req.items.length === 1 ? "item" : "items"})
                            </span>
                            <span className="font-mono text-lg sm:text-xl font-extrabold text-[#0073bc]">
                              {formatCurrency(req.totalEstimatedAmount, req.currency)}
                            </span>
                          </div>
                          <Link
                            href={`/requirements/${req.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 group-hover:bg-[#0073bc] px-4 py-2 text-xs font-bold text-zinc-700 group-hover:text-white transition-all shadow-2xs"
                          >
                            View <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Inbox className="h-10 w-10 text-zinc-300 mb-2" />
                  <p className="text-base font-bold text-zinc-800">No requisitions found</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Try adjusting your filters or search query.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRequest}
      />
    </div>
  );
}
