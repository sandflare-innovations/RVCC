import { prisma } from "../../lib/prisma";

/**
 * Requirements this vendor may see:
 * 1. Requirements where the vendor was explicitly invited
 * 2. Requirements where the vendor submitted a quote
 * 3. Open requirements available in the system
 */
export async function listOpenForVendor(_sql: unknown, vendorUserId: string) {
  // Find all requirements in the platform (open, awarded, ended)
  const requirements = await prisma.requirement.findMany({
    where: {
      deletedAt: null,
      status: { in: ["OPEN", "AWARDED", "CANCELLED"] },
    },
    include: {
      invites: {
        where: { vendorUserId },
      },
      quotes: {
        where: { vendorUserId },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requirements.map((r) => {
    const q = r.quotes[0];
    const isAwardedToMe = Boolean(q?.id && r.awardedQuoteId === q.id);
    const isPastDeadline = new Date(r.closesAt).getTime() <= Date.now();
    const isEnded = r.status === "AWARDED" || r.status === "CANCELLED" || isPastDeadline;

    let endedStatus: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null = null;
    if (isEnded) {
      if (r.status === "AWARDED") {
        endedStatus = isAwardedToMe ? "WON" : "LOST";
      } else if (r.status === "CANCELLED") {
        endedStatus = "CANCELLED";
      } else if (q?.status === "SUBMITTED") {
        endedStatus = "UNDER_EVALUATION";
      } else {
        endedStatus = "EXPIRED";
      }
    }

    return {
      id: r.id,
      referenceNumber: r.referenceNumber,
      scopeOfWork: r.scopeOfWork,
      project: r.project,
      currency: r.currency,
      closesAt: r.closesAt.toISOString(),
      status: r.status,
      isEnded,
      endedStatus,
      isAwardedToMe,
      awardedAt: r.awardedAt ? r.awardedAt.toISOString() : null,
      quoteId: q?.id ?? null,
      newPrice: q?.newPrice ? String(q.newPrice) : null,
      remarks: q?.remarks ?? null,
      quoteStatus: q?.status ?? null,
      submittedAt: q?.submittedAt ? q.submittedAt.toISOString() : null,
    };
  });
}

/**
 * A single requirement: allows any registered vendor on the platform to view
 */
export async function getOneForVendor(_sql: unknown, requirementId: string, vendorUserId: string) {
  const requirement = await prisma.requirement.findFirst({
    where: {
      id: requirementId,
      deletedAt: null,
    },
    include: {
      quotes: {
        where: { vendorUserId },
        take: 1,
      },
    },
  });

  if (!requirement) return [];

  const q = requirement.quotes[0];
  const isAwardedToMe = Boolean(q?.id && requirement.awardedQuoteId === q.id);
  const isPastDeadline = new Date(requirement.closesAt).getTime() <= Date.now();
  const isEnded =
    requirement.status === "AWARDED" ||
    requirement.status === "CANCELLED" ||
    isPastDeadline;

  let endedStatus: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null = null;
  if (isEnded) {
    if (requirement.status === "AWARDED") {
      endedStatus = isAwardedToMe ? "WON" : "LOST";
    } else if (requirement.status === "CANCELLED") {
      endedStatus = "CANCELLED";
    } else if (q?.status === "SUBMITTED") {
      endedStatus = "UNDER_EVALUATION";
    } else {
      endedStatus = "EXPIRED";
    }
  }

  return [
    {
      id: requirement.id,
      referenceNumber: requirement.referenceNumber,
      scopeOfWork: requirement.scopeOfWork,
      project: requirement.project,
      currency: requirement.currency,
      closesAt: requirement.closesAt.toISOString(),
      status: requirement.status,
      isEnded,
      endedStatus,
      isAwardedToMe,
      awardedAt: requirement.awardedAt ? requirement.awardedAt.toISOString() : null,
      quoteId: q?.id ?? null,
      newPrice: q?.newPrice ? String(q.newPrice) : null,
      remarks: q?.remarks ?? null,
      quoteStatus: q?.status ?? null,
      submittedAt: q?.submittedAt ? q.submittedAt.toISOString() : null,
    },
  ];
}

