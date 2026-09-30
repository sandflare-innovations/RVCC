export type VendorRequirementRow = {
  id: string;
  referenceNumber: string | null;
  project: string;
  scopeOfWork: string;
  opensAt?: string | null;
  closesAt: string;
  status?: string;
  isEnded?: boolean;
  endedStatus?: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null;
    isAwardedToMe?: boolean;
  awardedAt?: string | null;
  currency?: string;
  newPrice?: string | null;
  quoteStatus: "DRAFT" | "SUBMITTED" | null;
  submittedAt?: string | null;
  canLiveBid?: boolean;
};

export type VendorNextAction = {
  id: string;
  project: string;
  referenceNumber: string | null;
  deadline: ReturnType<typeof describeDeadline>;
  actionLabel: string;
};

export type BidWindowState = "unscheduled" | "scheduled" | "live" | "closed";

/** Clock state for a bid window. Missing open time means the window is already open. */
export function bidWindowState(
  opensAt?: string | null,
  closesAt?: string | null,
  now = Date.now()
): BidWindowState {
  const openMs = opensAt ? new Date(opensAt).getTime() : null;
  const closeMs = closesAt ? new Date(closesAt).getTime() : null;
  if ((openMs == null || Number.isNaN(openMs)) && (closeMs == null || Number.isNaN(closeMs))) {
    return "unscheduled";
  }
  if (openMs != null && !Number.isNaN(openMs) && openMs > now) return "scheduled";
  if (closeMs != null && !Number.isNaN(closeMs) && closeMs <= now) return "closed";
  return "live";
}

export function vendorWindowLabel(opensAt?: string | null, closesAt?: string | null, now = Date.now()) {
  const state = bidWindowState(opensAt, closesAt, now);
  if (state === "scheduled" && opensAt) {
    const when = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Riyadh",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(opensAt));
    return { label: `Opens ${when}`, urgent: new Date(opensAt).getTime() - now <= 48 * 3600000, state };
  }
  if (state === "closed") return { label: "Closed", urgent: false, state };
  if (state === "unscheduled") return { label: "Window not set", urgent: false, state };
  return { ...describeDeadline(closesAt), state };
}

export function describeDeadline(closesAt?: string | null) {
  if (!closesAt) return { label: "Not set", urgent: false };
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return { label: "Closed", urgent: false };
  const hours = ms / (1000 * 60 * 60);
  const urgent = hours <= 48;
  if (hours < 1) return { label: "Less than 1 hour left", urgent: true };
  if (hours < 24) {
    const h = Math.ceil(hours);
    return { label: `${h} hour${h === 1 ? "" : "s"} left`, urgent: true };
  }
  const days = Math.ceil(hours / 24);
  return {
    label: `${days} day${days === 1 ? "" : "s"} left`,
    urgent,
  };
}

export function summariseVendorDashboard(input: { requirements: VendorRequirementRow[] }) {
  const rows = Array.isArray(input?.requirements) ? input.requirements : [];
  const counts = {
    open: rows.length,
    dueSoon: rows.filter(
      (r) => describeDeadline(r.closesAt).urgent && r.quoteStatus !== "SUBMITTED"
    ).length,
    submitted: rows.filter((r) => r.quoteStatus === "SUBMITTED").length,
    drafts: rows.filter((r) => r.quoteStatus === "DRAFT").length,
  };

  const nextActions: VendorNextAction[] = rows
    .filter((r) => r.quoteStatus !== "SUBMITTED" && r.canLiveBid !== false)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      project: r.project,
      referenceNumber: r.referenceNumber,
      deadline: vendorWindowLabel(r.opensAt, r.closesAt),
      actionLabel: r.quoteStatus === "DRAFT" ? "Finish quote" : "Submit quote",
    }));

  return { counts, nextActions };
}
