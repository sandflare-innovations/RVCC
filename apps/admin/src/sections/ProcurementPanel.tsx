"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Building,
  Layers,
  ChevronRight,
} from "lucide-react";
import { PurchaseRequest, RequestStatus } from "@/types/procurement";
import { AdminProcurementStore } from "@/lib/procurement/storage";
import {
  formatCurrency,
  formatDate,
  getStatusBadgeInfo,
  getPriorityBadgeInfo,
} from "@/lib/procurement/formatters";

export function ProcurementPanel() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    setIsRefreshing(true);
    const data = AdminProcurementStore.getRequests();
    setRequests(data);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered requests
  const filtered = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requesterName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesDept = departmentFilter === "all" || req.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [requests, searchQuery, statusFilter, departmentFilter]);

  const departments = useMemo(() => {
    return Array.from(new Set(requests.map((r) => r.department))).filter(Boolean);
  }, [requests]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: requests.length,
      submitted: requests.filter((r) => r.status === "submitted").length,
      underReview: requests.filter((r) => r.status === "under_review").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      totalSpend: requests.reduce((sum, r) => sum + (r.totalEstimatedAmount || 0), 0),
    };
  }, [requests]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
            Procurement Requisitions
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review, evaluate, and approve project purchase requisitions submitted across construction packages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-xs hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-brand-blue" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4.5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Requisitions</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-900">{stats.total}</span>
            <span className="text-xs font-medium text-zinc-400">All packages</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4.5 shadow-xs">
          <p className="text-xs font-semibold text-[#0073bc] uppercase tracking-wider">Submitted</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#0073bc]">{stats.submitted}</span>
            <span className="text-xs font-medium text-blue-600">Pending Review</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4.5 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Under Review</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{stats.underReview}</span>
            <span className="text-xs font-medium text-amber-600">In Committee</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4.5 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Approved</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{stats.approved}</span>
            <span className="text-xs font-medium text-emerald-600">Ready for RFQ</span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-4.5 shadow-xs">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Est. Value</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-extrabold text-zinc-900 truncate">
              {formatCurrency(stats.totalSpend)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, PR number, requester, or department..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-4 text-xs text-zinc-900 outline-none transition focus:border-[#0073bc] focus:bg-white focus:ring-2 focus:ring-[#0073bc]/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-[#0073bc] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="draft">Draft</option>
          </select>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-[#0073bc] cursor-pointer max-w-[180px]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="py-3.5 px-4">Ref Number</th>
                <th className="py-3.5 px-4">Requisition Title</th>
                <th className="py-3.5 px-4">Department / Requester</th>
                <th className="py-3.5 px-4">Items / Category</th>
                <th className="py-3.5 px-4">Est. Amount</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <p className="font-semibold text-sm text-zinc-700">No requisitions found</p>
                    <p className="text-xs text-zinc-400 mt-1">Try adjusting your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const statusBadge = getStatusBadgeInfo(req.status);
                  const priorityBadge = getPriorityBadgeInfo(req.priority);

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                    >
                      {/* Ref Number */}
                      <td className="py-4 px-4 font-mono font-bold text-zinc-900 whitespace-nowrap">
                        <Link
                          href={`/procurement/${req.id}`}
                          className="hover:text-[#0073bc] hover:underline"
                        >
                          {req.referenceNumber}
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="py-4 px-4 max-w-xs">
                        <Link href={`/procurement/${req.id}`} className="block">
                          <p className="font-semibold text-zinc-900 line-clamp-1 group-hover:text-[#0073bc] transition-colors">
                            {req.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 font-normal">
                            {req.description}
                          </p>
                        </Link>
                      </td>

                      {/* Department & Requester */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-semibold text-zinc-800">{req.department}</p>
                        <p className="text-[11px] text-zinc-500">{req.requesterName}</p>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                          <Layers className="h-3 w-3 text-zinc-500" />
                          {req.items?.length || 0} line items
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-bold text-zinc-900 whitespace-nowrap">
                        {formatCurrency(req.totalEstimatedAmount, req.currency)}
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge.bgClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityBadge.dotClass}`} />
                          {priorityBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClass}`} />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/procurement/${req.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:border-[#0073bc] hover:text-[#0073bc] hover:bg-blue-50/20 transition-all"
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ProcurementSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="h-8 w-64 bg-zinc-200 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-zinc-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-zinc-100 rounded-2xl" />
    </div>
  );
}
