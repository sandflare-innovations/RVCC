import { prisma } from "../../lib/prisma";
import type {
  AdminLiveBidsPayload,
  AdminQuoteRankingItem,
  VendorAnonymizedBidItem,
  VendorLiveBidsPayload,
} from "@rvcc/types";

/**
 * Calculates dense price rankings for all submitted quotes on a requirement.
 * Lowest price is Rank #1 (L1), with tie-breakers decided by earlier submission timestamp.
 */
export async function getRequirementRankings(
  requirementId: string
): Promise<{
  requirement: {
    id: string;
    project: string;
    currency: string;
    status: string;
    sellingPrice: any; // Prisma Decimal
    closesAt: Date;
    awardedQuoteId: string | null;
  } | null;
  adminQuotes: AdminQuoteRankingItem[];
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
      closesAt: true,
      awardedQuoteId: true,
      quotes: {
        where: {
          status: "SUBMITTED",
          newPrice: { not: null },
        },
        include: {
          vendorUser: {
            select: {
              id: true,
              email: true,
              name: true,
              registration: {
                select: {
                  company: {
                    select: { legalName: true, dbaName: true },
                  },
                },
              },
            },
          },
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

  // Filter valid submitted quotes with positive price
  const validQuotes = req.quotes.filter(
    (q) => q.newPrice !== null && Number(q.newPrice) > 0
  );

  // Sort ascending by price, then by submittedAt timestamp (tie breaker)
  validQuotes.sort((a, b) => {
    const priceA = Number(a.amountSar ?? a.newPrice);
    const priceB = Number(b.amountSar ?? b.newPrice);
    if (priceA !== priceB) return priceA - priceB;
    const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return timeA - timeB;
  });

  const lowestNum = validQuotes.length > 0 ? Number(validQuotes[0]!.amountSar ?? validQuotes[0]!.newPrice) : null;
  const lowestPrice = lowestNum !== null ? lowestNum.toFixed(2) : null;

  const totalQuotes = validQuotes.length;
  const totalPrice = validQuotes.reduce((sum, q) => sum + Number(q.amountSar ?? q.newPrice), 0);
  const averagePrice = totalQuotes > 0 ? (totalPrice / totalQuotes).toFixed(2) : null;

  let lastPrice: number | null = null;
  let lastRank = 0;

  const adminQuotes: AdminQuoteRankingItem[] = validQuotes.map((q, index) => {
    const p = Number(q.amountSar ?? q.newPrice);
    // Dense ranking: identical price shares the same rank
    const rank = lastPrice !== null && p === lastPrice ? lastRank : index + 1;
    lastPrice = p;
    lastRank = rank;

    const companyName =
      q.vendorUser.registration?.company?.legalName ||
      q.vendorUser.registration?.company?.dbaName ||
      q.vendorUser.name ||
      q.vendorUser.email;

    const varianceFromL1Percent =
      lowestNum && lowestNum > 0 && p >= lowestNum
        ? Number((((p - lowestNum) / lowestNum) * 100).toFixed(1))
        : 0;

    return {
      id: q.id,
      rank,
      newPrice: Number(q.newPrice).toFixed(2),
      currency: q.currency,
      amountSar: q.amountSar ? Number(q.amountSar).toFixed(2) : null,
      remarks: q.remarks || null,
      submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
      who: companyName,
      vendorEmail: q.vendorUser.email,
      vendorId: q.vendorUserId,
      isLeading: rank === 1,
      varianceFromL1Percent,
    };
  });

  return {
    requirement: {
      id: req.id,
      project: req.project,
      currency: req.currency,
      status: req.status,
      sellingPrice: req.sellingPrice,
      closesAt: req.closesAt,
      awardedQuoteId: req.awardedQuoteId,
    },
    adminQuotes,
    lowestPrice,
    averagePrice,
    totalQuotes,
  };
}

/**
 * Builds full Admin live bids payload
 */
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
    sellingPrice: data.requirement.sellingPrice ? String(data.requirement.sellingPrice) : null,
    closesAt: data.requirement.closesAt.toISOString(),
    awardedQuoteId: data.requirement.awardedQuoteId,
    totalQuotes: data.totalQuotes,
    lowestPrice: data.lowestPrice,
    averagePrice: data.averagePrice,
    quotes: data.adminQuotes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Builds sanitized Vendor live bids payload (Blind Bidding / Anti-Collusion compliant)
 */
export async function buildVendorLiveBidsPayload(
  requirementId: string,
  vendorUserId: string
): Promise<VendorLiveBidsPayload | null> {
  const data = await getRequirementRankings(requirementId);
  if (!data.requirement) return null;

  // Find this vendor's quote (if any, including draft)
  const myQuoteRecord = await prisma.quote.findUnique({
    where: {
      requirementId_vendorUserId: {
        requirementId,
        vendorUserId,
      },
    },
    select: {
      status: true,
      newPrice: true,
    },
  });

  const myStatus: "DRAFT" | "SUBMITTED" | "NOT_STARTED" =
    myQuoteRecord?.status === "SUBMITTED"
      ? "SUBMITTED"
      : myQuoteRecord?.status === "DRAFT"
        ? "DRAFT"
        : "NOT_STARTED";

  const myPrice = myQuoteRecord?.newPrice ? Number(myQuoteRecord.newPrice).toFixed(2) : null;

  // Determine vendor's rank
  const myRankItem = data.adminQuotes.find((q) => q.vendorId === vendorUserId);
  const myRank = myRankItem ? myRankItem.rank : null;
  const isLeading = myRank === 1;

  // Anonymized leaderboard for vendor view
  const leaderboard: VendorAnonymizedBidItem[] = data.adminQuotes.map((q) => {
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
  });

  return {
    requirementId: data.requirement.id,
    project: data.requirement.project,
    currency: data.requirement.currency,
    status: data.requirement.status,
    closesAt: data.requirement.closesAt.toISOString(),
    totalBidders: data.totalQuotes,
    lowestPrice: data.lowestPrice,
    myRank,
    myPrice,
    myStatus,
    isLeading,
    leaderboard,
    updatedAt: new Date().toISOString(),
  };
}
