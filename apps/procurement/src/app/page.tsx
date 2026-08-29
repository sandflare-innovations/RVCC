"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/sections/layout/navbar";
import { MetricsOverview } from "@/sections/dashboard/metrics-overview";
import { DashboardToolbar } from "@/sections/dashboard/dashboard-toolbar";
import { RequisitionsTable } from "@/sections/requests/requisitions-table";
import { RequisitionsGrid } from "@/sections/requests/requisitions-grid";
import { NewRequestModal } from "@/sections/requests/new-request-modal";
import { PurchaseRequest, ProcurementStats } from "@/types/procurement";
import { ProcurementStore } from "@/lib/storage";
import { getClientProcurementProfile, ProcurementProfile } from "@/lib/profile-client";

import { useProcurementStore } from "@/lib/store";

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

  const handleCreateRequest = async (newReqData: any) => {
    try {
      const res = await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReqData),
      });

      if (res.ok) {
        const created = await res.json();
        await loadData();
        router.push(`/requirements/${created.id || created.referenceNumber}`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create requisition. Please check all fields.");
      }
    } catch (e) {
      console.error("Failed to create request", e);
      alert("Network error while creating requisition.");
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
    const matchesDept =
      departmentFilter === "all" || req.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 font-enquire text-zinc-900">
      {/* Sticky Header / Navbar */}
      <div className="shrink-0 z-30">
        <Navbar
          onOpenNewRequest={() => setIsModalOpen(true)}
          onRefreshData={loadData}
          user={user}
        />
      </div>

      {/* Main Container: Centered Layout with Balanced 100vh */}
      <main className="mx-auto max-w-8xl w-full px-4 sm:px-6 lg:px-8 pt-4 pb-4 flex-1 flex flex-col min-h-0 gap-3">
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
        <div className="flex-1 min-h-0 flex flex-col rounded-3xl border border-zinc-100/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] overflow-hidden">
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
