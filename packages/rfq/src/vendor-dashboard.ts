import { type Deadline, describeDeadline } from "./deadline";

export type VendorRequirementRow = {
  id: string;
  referenceNumber: string | null;
  project: string;
  closesAt: string;
  quoteStatus: "DRAFT" | "SUBMITTED" | null;
};

export type VendorDashboardInput = {
  requirements: VendorRequirementRow[];
  now?: Date;
};

export type VendorNextAction = {
  id: string;
  referenceNumber: string | null;
  project: string;
  deadline: Deadline;
  action: "SUBMIT" | "CONTINUE" | "VIEW";
  actionLabel: string;
};

/** Three fits the card without scrolling; the rest live on the list page. */
const NEXT_ACTION_LIMIT = 3;

const ACTION_LABEL = {
  SUBMIT: "Submit quote",
  CONTINUE: "Continue draft",
  VIEW: "View quote",
} as const;

function actionFor(status: VendorRequirementRow["quoteStatus"]): VendorNextAction["action"] {
  if (status === "SUBMITTED") return "VIEW";
  if (status === "DRAFT") return "CONTINUE";
  return "SUBMIT";
}

/**
 * Turns the vendor's open requirements into the overview: four counts and the
 * handful of items worth acting on now.
 *
 * The caller passes only requirements this vendor may see — the worker query
 * has already filtered by the session's vendor id. This function does no
 * access control and must never be handed an unfiltered list.
 */
export function summariseVendorDashboard({ requirements, now = new Date() }: VendorDashboardInput) {
  const counts = {
    open: requirements.length,
    // Work already submitted is not "due": counting it would push a supplier
    // back into a form they have finished.
    dueSoon: requirements.filter(
      (r) => r.quoteStatus !== "SUBMITTED" && describeDeadline(r.closesAt, now).urgent
    ).length,
    submitted: requirements.filter((r) => r.quoteStatus === "SUBMITTED").length,
    drafts: requirements.filter((r) => r.quoteStatus === "DRAFT").length,
  };

  const nextActions: VendorNextAction[] = [...requirements]
    .sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime())
    .slice(0, NEXT_ACTION_LIMIT)
    .map((r) => {
      const action = actionFor(r.quoteStatus);
      return {
        id: r.id,
        referenceNumber: r.referenceNumber,
        project: r.project,
        deadline: describeDeadline(r.closesAt, now),
        action,
        actionLabel: ACTION_LABEL[action],
      };
    });

  return { counts, nextActions };
}
