import { PriorityLevel, RequestStatus } from "@/types/procurement";

export function formatCurrency(amount: number, currency: string = "SAR"): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function getStatusBadgeInfo(status: RequestStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
} {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        bgClass: "bg-blue-50",
        textClass: "text-[#0073bc] font-medium",
        borderClass: "border-blue-200",
        dotClass: "bg-[#0073bc] animate-pulse",
      };
    case "under_review":
      return {
        label: "Under Review",
        bgClass: "bg-amber-50",
        textClass: "text-amber-700 font-medium",
        borderClass: "border-amber-200",
        dotClass: "bg-amber-500 animate-pulse",
      };
    case "approved":
      return {
        label: "Approved",
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-700 font-medium",
        borderClass: "border-emerald-200",
        dotClass: "bg-emerald-500",
      };
    case "rejected":
      return {
        label: "Rejected",
        bgClass: "bg-rose-50",
        textClass: "text-rose-700 font-medium",
        borderClass: "border-rose-200",
        dotClass: "bg-rose-500",
      };
    case "revision_requested":
      return {
        label: "Revision Needed",
        bgClass: "bg-purple-50",
        textClass: "text-purple-700 font-medium",
        borderClass: "border-purple-200",
        dotClass: "bg-purple-500",
      };
    case "draft":
    default:
      return {
        label: "Draft",
        bgClass: "bg-slate-100",
        textClass: "text-slate-700 font-medium",
        borderClass: "border-slate-200",
        dotClass: "bg-slate-400",
      };
  }
}

export function getPriorityBadgeInfo(priority: PriorityLevel): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (priority) {
    case "urgent":
      return {
        label: "Urgent",
        bgClass: "bg-rose-100",
        textClass: "text-rose-800 font-semibold",
        borderClass: "border-rose-300",
      };
    case "high":
      return {
        label: "High",
        bgClass: "bg-amber-100",
        textClass: "text-amber-800 font-semibold",
        borderClass: "border-amber-300",
      };
    case "medium":
      return {
        label: "Medium",
        bgClass: "bg-blue-50",
        textClass: "text-[#0073bc] font-medium",
        borderClass: "border-blue-200",
      };
    case "low":
    default:
      return {
        label: "Low",
        bgClass: "bg-slate-100",
        textClass: "text-slate-600 font-medium",
        borderClass: "border-slate-200",
      };
  }
}
