import { prisma } from "../../../lib/prisma";
import type {
  AdminLiveBidsPayload,
  AdminQuoteRankingItem,
  VendorAnonymizedBidItem,
  VendorLiveBidsPayload,
} from "@rvcc/schemas";
import { negotiationPhase } from "../lib/status-machine";

type RankedQuote = AdminQuoteRankingItem & {
  deliveryPeriodDays: number | null;
  paymentTerms: string;
  differenceFromTarget: number | null;
  differencePercent: number | null;
  isClosestToTarget: boolean;
  isBestPrice: boolean;
  isFastestDelivery: boolean;
};

function bidAmount(q: { amountSar?: unknown; totalPrice?: unknown; newPrice?: unknown }): number {
  return Number(q.amountSar ?? q.totalPrice ?? q.newPrice ?? 0);
}

function compareByTime(a: { submittedAt?: Date | string | null }, b: { submittedAt?: Date | string | null }) {
  const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
  const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
  return timeA - timeB;
}

/**
 * Rank quotes using the strategy stored on the requirement.
 * Ranking never awards the procurement — Admin always decides.
 */
export async function getRequirementRankings(requirementId: string): Promise<{
  requirement: {
    id: string;
    project: string;
    currency: string;
    status: string;
    sellingPrice: unknown;
    opensAt: Date | null;
    closesAt: Date | null;
    awardedQuoteId: string | null;
    rankingStrategy: string;
    revealCompetitorPrices: boolean;
    revealTargetPrice: boolean;
    priceWeight: number;
    technicalWeight: number;
    commercialWeight: number;
  } | null;
  adminQuotes: RankedQuote[];
  lowestPrice: string | null;
  averagePrice: string | null;
  totalQuotes: number;
}> {
  const req = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: {
      id: true,
      project: true,
      currency: true,
      status: true,
      sellingPrice: true,
      opensAt: true,
      closesAt: true,
      awardedQuoteId: true,
      rankingStrategy: true,
      revealCompetitorPrices: true,
      revealTargetPrice: true,
      priceWeight: true,
      technicalWeight: true,
      commercialWeight: true,
      quotes: {
        where: {
          status: "SUBMITTED",
          deletedAt: null,
          newPrice: { not: null },
        },
        include: {
          vendorUser: {
            select: {
              id: true,
              email: true,
              name: true,
              registration: {
                select: { company: { select: { legalName: true, dbaName: true } } },
              },
            },
          },
          attachments: {
            orderBy: { uploadedAt: "asc" as const },
            take: 1,
            select: { id: true },
          },
          _count: { select: { revisions: true } },
        },
      },
    },
  });

  if (!req) {
    return {
      requirement: null,
      adminQuotes: [],
      lowestPrice: null,
      averagePrice: null,
      totalQuotes: 0,
    };
  }

  const validQuotes = req.quotes.filter((q) => bidAmount(q) > 0);
  const manuals = await prisma.manualQuotation.findMany({
    where: { requirementId, deletedAt: null },
    select: { vendorUserId: true, totalPrice: true, amountSar: true },
  });
  const originalByVendor = new Map<string, number>();
  for (const row of manuals) {
    if (!row.vendorUserId) continue;
    const amount = Number(row.amountSar ?? row.totalPrice);
    if (amount > 0) originalByVendor.set(row.vendorUserId, amount);
  }
  const target = req.sellingPrice != null ? Number(req.sellingPrice) : null;
  const strategy = req.rankingStrategy || "LOWEST_PRICE";

  validQuotes.sort((a, b) => {
    const priceA = bidAmount(a);
    const priceB = bidAmount(b);
    if (strategy === "CLOSEST_TO_TARGET" && target != null) {
      const diff = Math.abs(priceA - target) - Math.abs(priceB - target);
      if (diff !== 0) return diff;
      return compareByTime(a, b);
    }
    if (strategy === "TECHNICAL_COMMERCIAL" || strategy === "WEIGHTED") {
      const priceW = Number(req.priceWeight ?? 50);
      const techW = Number(req.technicalWeight ?? 25);
      const commW = Number(req.commercialWeight ?? 25);
      const score = (q: (typeof validQuotes)[number]) => {
        const priceScore = target && target > 0 ? Math.max(0, 100 - (Math.abs(bidAmount(q) - target) / target) * 100) : 100 - priceA;
        return (
          (priceScore * priceW +
            Number(q.technicalScore ?? 0) * techW +
            Number(q.commercialScore ?? 0) * commW) /
          Math.max(1, priceW + techW + commW)
        );
      };
      const delta = score(b) - score(a);
      if (delta !== 0) return delta;
      return compareByTime(a, b);
    }
    if (priceA !== priceB) return priceA - priceB;
    return compareByTime(a, b);
  });

  const prices = validQuotes.map((q) => bidAmount(q));
  const lowestNum = prices.length ? Math.min(...prices) : null;
  const lowestPrice = lowestNum != null ? lowestNum.toFixed(2) : null;
  const totalQuotes = validQuotes.length;
  const averagePrice =
    totalQuotes > 0 ? (prices.reduce((sum, n) => sum + n, 0) / totalQuotes).toFixed(2) : null;

  const fastestDelivery = validQuotes.reduce<number | null>((min, q) => {
    if (q.deliveryPeriodDays == null) return min;
    return min == null ? q.deliveryPeriodDays : Math.min(min, q.deliveryPeriodDays);
  }, null);

  let closestId: string | null = null;
  if (target != null && validQuotes.length) {
    closestId = [...validQuotes].sort(
      (a, b) => Math.abs(bidAmount(a) - target) - Math.abs(bidAmount(b) - target)
    )[0]!.id;
  }

  let lastKey: string | null = null;
  let lastRank = 0;
  const adminQuotes: RankedQuote[] = validQuotes.map((q, index) => {
    const p = bidAmount(q);
    const key = `${strategy}:${p}:${q.technicalScore ?? 0}:${q.commercialScore ?? 0}`;
    const rank = lastKey === key ? lastRank : index + 1;
    lastKey = key;
    lastRank = rank;
    const companyName =
      q.vendorUser.registration?.company?.legalName ||
      q.vendorUser.registration?.company?.dbaName ||
      q.vendorUser.name ||
      q.vendorUser.email;
    const differenceFromTarget = target != null ? Math.round((p - target) * 100) / 100 : null;
    const differencePercent =
      target && target !== 0 && differenceFromTarget != null
        ? Math.round((differenceFromTarget / target) * 10000) / 100
        : null;

    const original = originalByVendor.get(q.vendorUserId) ?? null;
    const firstAttachment = q.attachments[0];
    return {
      id: q.id,
      rank,
      newPrice: Number(q.newPrice).toFixed(2),
      currency: q.currency,
      amountSar: q.amountSar ? Number(q.amountSar).toFixed(2) : null,
      remarks: q.remarks || null,
      quoteFileUrl: firstAttachment
        ? `/api/requirements/${requirementId}/files/${firstAttachment.id}?kind=quote`
        : null,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      who: companyName,
      vendorEmail: q.vendorUser.email,
      vendorId: q.vendorUserId,
      isLeading: rank === 1,
      varianceFromL1Percent:
        lowestNum && lowestNum > 0 ? Number((((p - lowestNum) / lowestNum) * 100).toFixed(1)) : 0,
      originalQuotation: original != null ? original.toFixed(2) : null,
      reductionFromOriginalPercent:
        original && original > 0 ? Number((((original - p) / original) * 100).toFixed(1)) : null,
      differenceFromTarget,
      differencePercent,
      revisionCount: q._count.revisions,
      deliveryPeriodDays: q.deliveryPeriodDays ?? null,
      paymentTerms: q.paymentTerms || "",
      isClosestToTarget: q.id === closestId,
      isBestPrice: lowestNum != null && p === lowestNum,
      isFastestDelivery: fastestDelivery != null && q.deliveryPeriodDays === fastestDelivery,
    };
  });

  return {
    requirement: {
      id: req.id,
      project: req.project,
      currency: req.currency,
      status: req.status,
      sellingPrice: req.sellingPrice,
      opensAt: req.opensAt,
      closesAt: req.closesAt,
      awardedQuoteId: req.awardedQuoteId,
      rankingStrategy: strategy,
      revealCompetitorPrices: Boolean(req.revealCompetitorPrices),
      revealTargetPrice: Boolean(req.revealTargetPrice),
      priceWeight: Number(req.priceWeight ?? 50),
      technicalWeight: Number(req.technicalWeight ?? 25),
      commercialWeight: Number(req.commercialWeight ?? 25),
    },
    adminQuotes,
    lowestPrice,
    averagePrice,
    totalQuotes,
  };
}

export async function buildAdminLiveBidsPayload(
  requirementId: string
): Promise<AdminLiveBidsPayload | null> {
  const data = await getRequirementRankings(requirementId);
  if (!data.requirement) return null;

  return {
    requirementId: data.requirement.id,
    project: data.requirement.project,
    currency: data.requirement.currency,
    status: data.requirement.status,
    phase: negotiationPhase(data.requirement.status, data.requirement.opensAt, data.requirement.closesAt),
    sellingPrice: data.requirement.sellingPrice ? String(data.requirement.sellingPrice) : null,
    opensAt: data.requirement.opensAt ? data.requirement.opensAt.toISOString() : null,
    closesAt: data.requirement.closesAt ? data.requirement.closesAt.toISOString() : "",
    serverTime: new Date().toISOString(),
    awardedQuoteId: data.requirement.awardedQuoteId,
    totalQuotes: data.totalQuotes,
    lowestPrice: data.lowestPrice,
    averagePrice: data.averagePrice,
    quotes: data.adminQuotes,
    updatedAt: new Date().toISOString(),
  };
}

export async function buildVendorLiveBidsPayload(
  requirementId: string,
  vendorUserId: string
): Promise<VendorLiveBidsPayload | null> {
  const data = await getRequirementRankings(requirementId);
  if (!data.requirement) return null;

  const myQuoteRecord = await prisma.quote.findUnique({
    where: { requirementId_vendorUserId: { requirementId, vendorUserId } },
    select: { status: true, newPrice: true },
  });

  const myStatus: "DRAFT" | "SUBMITTED" | "NOT_STARTED" =
    myQuoteRecord?.status === "SUBMITTED"
      ? "SUBMITTED"
      : myQuoteRecord?.status === "DRAFT"
        ? "DRAFT"
        : "NOT_STARTED";

  const myPrice = myQuoteRecord?.newPrice ? Number(myQuoteRecord.newPrice).toFixed(2) : null;
  const myRankItem = data.adminQuotes.find((q) => q.vendorId === vendorUserId);
  const myRank = myRankItem ? myRankItem.rank : null;
  const reveal = data.requirement.revealCompetitorPrices;

  const leaderboard: VendorAnonymizedBidItem[] = reveal
    ? data.adminQuotes.map((q) => {
        const isYou = q.vendorId === vendorUserId;
        return {
          rank: q.rank,
          price: q.newPrice,
          currency: q.currency,
          amountSar: q.amountSar,
          submittedAt: q.submittedAt,
          isYou,
          maskedName: isYou ? "You" : `Bidder #${q.rank}`,
        };
      })
    : data.adminQuotes
        .filter((q) => q.vendorId === vendorUserId)
        .map((q) => ({
          rank: q.rank,
          price: q.newPrice,
          currency: q.currency,
          amountSar: q.amountSar,
          submittedAt: q.submittedAt,
          isYou: true,
          maskedName: "You",
        }));

  return {
    requirementId: data.requirement.id,
    project: data.requirement.project,
    currency: data.requirement.currency,
    status: data.requirement.status,
    phase: negotiationPhase(data.requirement.status, data.requirement.opensAt, data.requirement.closesAt),
    targetPrice: data.requirement.revealTargetPrice && data.requirement.sellingPrice
      ? String(data.requirement.sellingPrice)
      : null,
    opensAt: data.requirement.opensAt ? data.requirement.opensAt.toISOString() : null,
    closesAt: data.requirement.closesAt ? data.requirement.closesAt.toISOString() : "",
    serverTime: new Date().toISOString(),
    totalBidders: reveal ? data.totalQuotes : myStatus === "SUBMITTED" ? 1 : 0,
    lowestPrice: reveal ? data.lowestPrice : myPrice,
    myRank: reveal ? myRank : myRank,
    myPrice,
    myStatus,
    isLeading: reveal ? myRank === 1 : false,
    leaderboard,
    updatedAt: new Date().toISOString(),
  };
}
