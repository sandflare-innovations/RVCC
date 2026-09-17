export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  QUOTATION_COLLECTION: "Quotation Collection",
  SUBMITTED_TO_ADMIN: "Submitted to Admin",
  PENDING: "Submitted to Admin",
  OPEN: "Bidding Open",
  BIDDING_CLOSED: "Bidding Closed",
  EVALUATING: "Under Evaluation",
  SHORTLISTED: "Shortlisted",
  AWARDED: "Awarded",
  CANCELLED: "Cancelled",
  REJECTED: "Cancelled",
};

/** Derived OPEN phases: Scheduled before opensAt, Live inside the window, Closed after closesAt. */
export function statusLabel(status: string, closesAt?: string | null, opensAt?: string | null) {
  if (status === "OPEN") {
    const now = Date.now();
    if (opensAt && new Date(opensAt).getTime() > now) return "Scheduled";
    if (closesAt && new Date(closesAt).getTime() <= now) return "Closed";
    return "Live";
  }
  return STATUS_LABELS[status] || status;
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-amber-100 text-amber-800";
    case "QUOTATION_COLLECTION":
      return "bg-sky-100 text-sky-800";
    case "SUBMITTED_TO_ADMIN":
    case "PENDING":
      return "bg-indigo-100 text-indigo-800";
    case "OPEN":
      return "bg-emerald-100 text-emerald-800";
    case "BIDDING_CLOSED":
      return "bg-purple-100 text-purple-800";
    case "EVALUATING":
      return "bg-violet-100 text-violet-800";
    case "SHORTLISTED":
      return "bg-teal-100 text-teal-800";
    case "AWARDED":
      return "bg-brand-blue/15 text-brand-blue";
    case "CANCELLED":
    case "REJECTED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export function formatMoney(value: unknown, currency = "SAR") {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
