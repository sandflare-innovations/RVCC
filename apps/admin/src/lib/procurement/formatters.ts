import { PriorityLevel, RequestStatus } from "@/types/procurement";

export function formatCurrency(amount: number, currency: string = "SAR"): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: currency || "SAR",
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
        textClass: "text-[#0073bc] font-semibold",
        borderClass: "border-blue-200",
        dotClass: "bg-[#0073bc] animate-pulse",
      };
    case "under_review":
      return {
        label: "Under Review",
        bgClass: "bg-amber-50",
        textClass: "text-amber-700 font-semibold",
        borderClass: "border-amber-200",
        dotClass: "bg-amber-500",
      };
    case "approved":
      return {
        label: "Approved",
        bgClass: "bg-emerald-50",
        textClass: "text-emerald-700 font-semibold",
        borderClass: "border-emerald-200",
        dotClass: "bg-emerald-500",
      };
    case "rejected":
      return {
        label: "Rejected",
        bgClass: "bg-red-50",
        textClass: "text-red-700 font-semibold",
        borderClass: "border-red-200",
        dotClass: "bg-red-500",
      };
    case "revision_requested":
      return {
        label: "Revision Req.",
        bgClass: "bg-purple-50",
        textClass: "text-purple-700 font-semibold",
        borderClass: "border-purple-200",
        dotClass: "bg-purple-500",
      };
    default:
      return {
        label: "Draft",
        bgClass: "bg-zinc-100",
        textClass: "text-zinc-700 font-semibold",
        borderClass: "border-zinc-200",
        dotClass: "bg-zinc-400",
      };
  }
}

export function getPriorityBadgeInfo(priority: PriorityLevel): {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
} {
  switch (priority) {
    case "urgent":
      return {
        label: "Urgent",
        bgClass: "bg-red-50 text-red-700 border border-red-200",
        textClass: "text-red-700 font-bold",
        dotClass: "bg-red-500",
      };
    case "high":
      return {
        label: "High",
        bgClass: "bg-amber-50 text-amber-700 border border-amber-200",
        textClass: "text-amber-700 font-medium",
        dotClass: "bg-amber-500",
      };
    case "medium":
      return {
        label: "Medium",
        bgClass: "bg-blue-50 text-blue-700 border border-blue-200",
        textClass: "text-blue-700 font-medium",
        dotClass: "bg-blue-500",
      };
    default:
      return {
        label: "Low",
        bgClass: "bg-zinc-100 text-zinc-600 border border-zinc-200",
        textClass: "text-zinc-600 font-medium",
        dotClass: "bg-zinc-400",
      };
  }
}
