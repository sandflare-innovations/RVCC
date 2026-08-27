"use client";

import React from "react";
import {
  FileText,
  FileClock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { ProcurementStats } from "@/types/procurement";
import { formatCurrency } from "@/lib/formatters";
import { KpiCard } from "@/components/ui/kpi-card";

interface MetricsOverviewProps {
  stats: ProcurementStats;
}

export function MetricsOverview({ stats }: MetricsOverviewProps) {
  return (
    <section className="shrink-0">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Requisitions"
          value={stats.totalRequests}
          icon={<FileText className="h-4 w-4" />}
          trend="up"
          trendValue="+12%"
        />
        <KpiCard
          label="Awaiting Review"
          value={stats.pendingReviewCount}
          icon={<FileClock className="h-4 w-4" />}
          trend={stats.pendingReviewCount > 0 ? "up" : "neutral"}
          trendValue={stats.pendingReviewCount > 0 ? "Active" : "Clear"}
        />
        <KpiCard
          label="Approved Requests"
          value={stats.approvedCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend="up"
          trendValue="+8%"
        />
        <KpiCard
          label="Total Est. Spend"
          value={formatCurrency(stats.totalEstimatedSpend)}
          icon={<DollarSign className="h-4 w-4" />}
          trend="neutral"
          trendValue="YTD"
        />
      </div>
    </section>
  );
}
