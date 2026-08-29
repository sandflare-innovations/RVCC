"use client";

import React from "react";
import {
  RefreshCw,
  ChevronDown,
  Plus,
  Table as TableIcon,
  LayoutGrid,
} from "lucide-react";
import { AnimatedSearchInput } from "@/components/ui/animated-search-input";

export interface FilterOption {
  value: string;
  label: string;
}

export const STATUS_FILTERS: FilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "revision_requested", label: "Revision Requested" },
];

export const DEPARTMENT_FILTERS: FilterOption[] = [
  { value: "all", label: "All Trades / Departments" },
  { value: "Civil & Structural Engineering", label: "Civil & Structural" },
  { value: "MEP & Electrical Systems", label: "MEP & Electrical" },
  { value: "Heavy Plant & Machinery", label: "Heavy Plant & Equipment" },
  { value: "Architecture & Finishes", label: "Architecture & Finishes" },
  { value: "Site Safety & HSE", label: "Site Safety & HSE" },
  { value: "Infrastructure & Earthworks", label: "Infrastructure & Earthworks" },
];

export const SEARCH_PLACEHOLDERS = [
  "reference (e.g. PR-2026-001)...",
  "materials (Concrete, Rebar, Cable)...",
  "specification or package...",
  "trade or department...",
];

interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (dept: string) => void;
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenNewRequest: () => void;
}

export function DashboardToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  viewMode,
  onViewModeChange,
  isRefreshing,
  onRefresh,
  onOpenNewRequest,
}: DashboardToolbarProps) {
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
      {/* Left: Refresh Button + Animated Search Input */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
        <button
          type="button"
          onClick={onRefresh}
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
          onChange={onSearchChange}
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
            onClick={() => onViewModeChange("table")}
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
            onClick={() => onViewModeChange("grid")}
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
                    onStatusFilterChange(f.value);
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
                    onDepartmentFilterChange(f.value);
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
          onClick={onOpenNewRequest}
          className="bg-[#0073bc] hover:bg-[#005f9e] inline-flex h-[38px] items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none shrink-0 cursor-pointer active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Requisition
        </button>
      </div>
    </div>
  );
}
