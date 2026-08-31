export type VendorRequirementRow = {
  id: string;
  referenceNumber: string | null;
  project: string;
  scopeOfWork: string;
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
};

export type VendorNextAction = {
  id: string;
  project: string;
  referenceNumber: string | null;
  deadline: ReturnType<typeof describeDeadline>;
  actionLabel: string;
};

export function describeDeadline(closesAt: string) {
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
    .filter((r) => r.quoteStatus !== "SUBMITTED")
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      project: r.project,
      referenceNumber: r.referenceNumber,
      deadline: describeDeadline(r.closesAt),
      actionLabel: r.quoteStatus === "DRAFT" ? "Finish quote" : "Submit quote",
    }));

  return { counts, nextActions };
}
