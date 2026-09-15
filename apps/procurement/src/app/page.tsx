"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { useProcurementStore } from "@/lib/store";
import { DashboardToolbar } from "@/sections/dashboard/dashboard-toolbar";
import { MetricsOverview } from "@/sections/dashboard/metrics-overview";
import { Navbar } from "@/sections/layout/navbar";
import { NewRequestModal } from "@/sections/requests/new-request-modal";
import { RequisitionsGrid } from "@/sections/requests/requisitions-grid";
import { RequisitionsTable } from "@/sections/requests/requisitions-table";
import type { ProcurementStats } from "@/types/procurement";

export default function RequesterDashboard() {
  const router = useRouter();
  const {
    user,
    requests,
    isModalOpen,
    searchQuery,
    statusFilter,
    departmentFilter,
    viewMode,
    isRefreshing,
    setIsModalOpen,
    setSearchQuery,
    setStatusFilter,
    setDepartmentFilter,
    setViewMode,
    loadData,
  } = useProcurementStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRequest = async (
    newReqData: any
  ): Promise<{ ok: true } | { ok: false; errors: string[] }> => {
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newReqData.title,
          description: newReqData.description,
          department: newReqData.department,
          priority: newReqData.priority,
          requiredByDate: newReqData.requiredByDate,
          currency: newReqData.currency,
          estimatedAmount: newReqData.totalEstimatedAmount,
          requesterName: user?.name,
          requesterEmail: user?.email,
          items: (newReqData.items || []).map(
            (item: {
              name: string;
              category: string;
              quantity: number;
              unit: string;
              estimatedUnitPrice: number;
              totalPrice: number;
              preferredVendor?: string;
              notes?: string;
            }) => ({
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              unit: item.unit,
              estimatedUnitPrice: item.estimatedUnitPrice,
              totalPrice: item.totalPrice,
              preferredVendor: item.preferredVendor || null,
              notes: item.notes || null,
            })
          ),
          // File picker only stores url "#"; skip those until a real upload exists.
          attachments: (newReqData.attachments || []).filter(
            (att: { url?: string }) => att.url && att.url !== "#"
          ),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        await loadData();
        router.push(`/requirements/${created.id || created.referenceNumber}`);
        return { ok: true };
      }

      const err = await res.json().catch(() => ({}));
      const issues = Array.isArray(err.issues)
        ? err.issues.map((issue: { path?: string; message?: string }) =>
            issue.path && issue.path !== "(root)"
              ? `${issue.path}: ${issue.message}`
              : issue.message || "Invalid field"
          )
        : [];
      return {
        ok: false,
        errors: issues.length
          ? issues
          : [err.error || "Failed to create requisition. Please check all fields."],
      };
    } catch (e) {
      console.error("Failed to create request", e);
      return { ok: false, errors: ["Network error while creating requisition."] };
    }
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
    const matchesDept = departmentFilter === "all" || req.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="font-enquire flex h-screen flex-col overflow-hidden bg-zinc-50 text-zinc-900">
      {/* Sticky Header / Navbar */}
      <div className="z-30 shrink-0">
        <Navbar
          onOpenNewRequest={() => setIsModalOpen(true)}
          onRefreshData={loadData}
          user={user}
        />
      </div>

      {/* Main Container: Centered Layout with Balanced 100vh */}
      <main className="max-w-8xl mx-auto flex min-h-0 w-full flex-1 flex-col gap-3 px-4 pt-4 pb-4 sm:px-6 lg:px-8">
        {/* Compact KPI Metrics Overview */}
        <div className="shrink-0">
          <MetricsOverview stats={stats} />
        </div>

        {/* Toolbar: Refresh, Animated Search, Filters & View Toggle */}
        <DashboardToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isRefreshing={isRefreshing}
          onRefresh={loadData}
          onOpenNewRequest={() => setIsModalOpen(true)}
        />

        {/* Content View: Table or Grid (Fills remaining 100vh height with fluid width & internal scrolling) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          {viewMode === "table" ? (
            <RequisitionsTable
              requests={filteredRequests}
              onSelectRequest={(id) => router.push(`/requirements/${id}`)}
            />
          ) : (
            <RequisitionsGrid
              requests={filteredRequests}
              onSelectRequest={(id) => router.push(`/requirements/${id}`)}
            />
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
