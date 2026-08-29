import { prisma } from "../../lib/prisma";

/**
 * Requirements this vendor may see: invited, open, and not past closing.
 *
 * The vendor id comes from the caller's session — never from the request — so
 * one participant cannot read another's row by guessing an id.
 */
export async function listOpenForVendor(_sql: unknown, vendorUserId: string) {
  const invites = await prisma.requirementInvite.findMany({
    where: {
      vendorUserId,
      requirement: {
        status: "OPEN",
        closesAt: { gt: new Date() },
      },
    },
    include: {
      requirement: {
        include: {
          quotes: {
            where: { vendorUserId },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      requirement: {
        closesAt: "asc",
      },
    },
  });

  return invites.map((inv) => {
    const r = inv.requirement;
    const q = r.quotes[0];
    return {
      id: r.id,
      referenceNumber: r.referenceNumber,
      scopeOfWork: r.scopeOfWork,
      project: r.project,
      currency: r.currency,
      closesAt: r.closesAt.toISOString(),
      quoteId: q?.id ?? null,
      newPrice: q?.newPrice ? String(q.newPrice) : null,
      remarks: q?.remarks ?? null,
      quoteStatus: q?.status ?? null,
      submittedAt: q?.submittedAt ? q.submittedAt.toISOString() : null,
    };
  });
}

/**
 * A single requirement under the same visibility rule, but without the deadline
 * filter: a participant opening a link after closing should be told it closed,
 * not shown a 404 that reads as a broken system.
 */
export async function getOneForVendor(_sql: unknown, requirementId: string, vendorUserId: string) {
  const invite = await prisma.requirementInvite.findFirst({
    where: {
      vendorUserId,
      requirementId,
    },
    include: {
      requirement: {
        include: {
          quotes: {
            where: { vendorUserId },
            take: 1,
          },
        },
      },
    },
  });

  if (!invite) return [];

  const r = invite.requirement;
  const q = r.quotes[0];
  return [
    {
      id: r.id,
      referenceNumber: r.referenceNumber,
      scopeOfWork: r.scopeOfWork,
      project: r.project,
      currency: r.currency,
      closesAt: r.closesAt.toISOString(),
      status: r.status,
      quoteId: q?.id ?? null,
      newPrice: q?.newPrice ? String(q.newPrice) : null,
      remarks: q?.remarks ?? null,
      quoteStatus: q?.status ?? null,
      submittedAt: q?.submittedAt ? q.submittedAt.toISOString() : null,
    },
  ];
}
