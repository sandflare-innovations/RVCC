import { z } from "zod";

// ── Admin Live Bidding Schemas ──────────────────────────────────────────────

export const adminQuoteRankingItemSchema = z.object({
  id: z.string(),
  rank: z.number().int(),
  newPrice: z.string(),
  currency: z.string(),
  amountSar: z.string().nullable(),
  remarks: z.string().nullable(),
  quoteFileUrl: z.string().nullable().optional(),
  submittedAt: z.string().nullable(),
  who: z.string(),
  vendorEmail: z.string(),
  vendorId: z.string(),
  isLeading: z.boolean(),
  varianceFromL1Percent: z.number().optional(),
  originalQuotation: z.string().nullable().optional(),
  reductionFromOriginalPercent: z.number().nullable().optional(),
  differenceFromTarget: z.number().nullable().optional(),
  differencePercent: z.number().nullable().optional(),
  revisionCount: z.number().int().optional(),
});
export type AdminQuoteRankingItem = z.infer<typeof adminQuoteRankingItemSchema>;

export const adminLiveBidsPayloadSchema = z.object({
  requirementId: z.string(),
  project: z.string(),
  currency: z.string(),
  status: z.string(),
  phase: z.string().optional(),
  sellingPrice: z.string().nullable(),
  opensAt: z.string().nullable().optional(),
  closesAt: z.string(),
  serverTime: z.string().optional(),
  awardedQuoteId: z.string().nullable(),
  totalQuotes: z.number().int(),
  lowestPrice: z.string().nullable(),
  averagePrice: z.string().nullable(),
  quotes: z.array(adminQuoteRankingItemSchema),
  updatedAt: z.string(),
});
export type AdminLiveBidsPayload = z.infer<typeof adminLiveBidsPayloadSchema>;

// ── Vendor Live Bidding Schemas ─────────────────────────────────────────────

export const vendorAnonymizedBidItemSchema = z.object({
  rank: z.number().int(),
  price: z.string(),
  currency: z.string(),
  amountSar: z.string().nullable().optional(),
  submittedAt: z.string().nullable(),
  isYou: z.boolean(),
  maskedName: z.string(),
});
export type VendorAnonymizedBidItem = z.infer<typeof vendorAnonymizedBidItemSchema>;

export const vendorLiveBidsPayloadSchema = z.object({
  requirementId: z.string(),
  project: z.string(),
  currency: z.string(),
  status: z.string(),
  phase: z.string().optional(),
  targetPrice: z.string().nullable().optional(),
  opensAt: z.string().nullable().optional(),
  closesAt: z.string(),
  serverTime: z.string().optional(),
  totalBidders: z.number().int(),
  lowestPrice: z.string().nullable(),
  myRank: z.number().int().nullable(),
  myPrice: z.string().nullable(),
  myStatus: z.enum(["DRAFT", "SUBMITTED", "NOT_STARTED"]),
  isLeading: z.boolean(),
  leaderboard: z.array(vendorAnonymizedBidItemSchema),
  updatedAt: z.string(),
});
export type VendorLiveBidsPayload = z.infer<typeof vendorLiveBidsPayloadSchema>;
