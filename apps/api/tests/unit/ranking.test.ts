import { describe, expect, it, vi, beforeEach } from "vitest";
import { getRequirementRankings, buildVendorLiveBidsPayload } from "../../src/modules/sourcing/bidding/ranking.service";
import { prisma } from "../../src/lib/prisma";

// Mock the prisma client for deterministic unit testing
vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    requirement: {
      findUnique: vi.fn(),
    },
    quote: {
      findUnique: vi.fn(),
    },
  },
}));

describe("QA Auction & Procurement Tests: Dense Ranking, Anti-Collusion & Tie-Breakers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequirement = {
    id: "req-101",
    project: "Al-Khobar Hospital Expansion",
    currency: "SAR",
    status: "OPEN",
    sellingPrice: null,
    closesAt: new Date(Date.now() + 86400000),
    rankingStrategy: "LOWEST_PRICE",
    revealCompetitorPrices: true,
    revealTargetPrice: false,
    priceWeight: 50,
    technicalWeight: 25,
    commercialWeight: 25,
    awardedQuoteId: null,
    quotes: [
      {
        id: "q-1",
        newPrice: "50000.00",
        amountSar: "50000.00",
        currency: "SAR",
        status: "SUBMITTED",
        submittedAt: new Date("2026-09-01T10:00:00Z"),
        remarks: "Bidder 1 remarks",
        vendorUserId: "vendor-alpha",
        vendorUser: {
          id: "vendor-alpha",
          email: "alpha@vendor.sa",
          name: "Alpha Contracting",
          registration: {
            company: { legalName: "Alpha Contracting LLC", dbaName: "Alpha Co" },
          },
        },
      },
      {
        id: "q-2",
        newPrice: "45000.00",
        amountSar: "45000.00",
        currency: "SAR",
        status: "SUBMITTED",
        submittedAt: new Date("2026-09-01T11:00:00Z"),
        remarks: "Bidder 2 remarks",
        vendorUserId: "vendor-beta",
        vendorUser: {
          id: "vendor-beta",
          email: "beta@vendor.sa",
          name: "Beta Electro",
          registration: {
            company: { legalName: "Beta Electro Co", dbaName: "Beta" },
          },
        },
      },
      {
        id: "q-3",
        newPrice: "45000.00", // Identical price to q-2 (Tie-break test)
        amountSar: "45000.00",
        currency: "SAR",
        status: "SUBMITTED",
        submittedAt: new Date("2026-09-01T12:00:00Z"), // Submitted later than q-2
        remarks: "Bidder 3 remarks",
        vendorUserId: "vendor-gamma",
        vendorUser: {
          id: "vendor-gamma",
          email: "gamma@vendor.sa",
          name: "Gamma Services",
          registration: {
            company: { legalName: "Gamma Services", dbaName: "" },
          },
        },
      },
      {
        id: "q-4",
        newPrice: "60000.00",
        amountSar: "60000.00",
        currency: "SAR",
        status: "SUBMITTED",
        submittedAt: new Date("2026-09-01T09:00:00Z"),
        remarks: "Bidder 4 remarks",
        vendorUserId: "vendor-delta",
        vendorUser: {
          id: "vendor-delta",
          email: "delta@vendor.sa",
          name: "Delta Infra",
          registration: {
            company: { legalName: "Delta Infra", dbaName: "" },
          },
        },
      },
    ],
  };

  it("should accurately calculate lowest price and dense rankings (L1/L2)", async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(mockRequirement as any);

    const result = await getRequirementRankings("req-101");

    expect(result.lowestPrice).toBe("45000.00");
    expect(result.totalQuotes).toBe(4);

    // Q-2 was 45000 at 11:00 -> Rank 1 (L1)
    const quoteBeta = result.adminQuotes.find((q) => q.vendorId === "vendor-beta");
    expect(quoteBeta?.rank).toBe(1);
    expect(quoteBeta?.isLeading).toBe(true);
    expect(quoteBeta?.varianceFromL1Percent).toBe(0);

    // Q-3 was also 45000 -> Should share Rank 1 (dense ranking)
    const quoteGamma = result.adminQuotes.find((q) => q.vendorId === "vendor-gamma");
    expect(quoteGamma?.rank).toBe(1);
    expect(quoteGamma?.isLeading).toBe(true);
    expect(quoteGamma?.varianceFromL1Percent).toBe(0);

    // Q-1 was 50000 (3rd quote in sorted order) -> Rank 3
    const quoteAlpha = result.adminQuotes.find((q) => q.vendorId === "vendor-alpha");
    expect(quoteAlpha?.rank).toBe(3);
    expect(quoteAlpha?.isLeading).toBe(false);
    // (50000 - 45000) / 45000 * 100 = 11.1%
    expect(quoteAlpha?.varianceFromL1Percent).toBe(11.1);

    // Q-4 was 60000 (4th quote in sorted order) -> Rank 4
    const quoteDelta = result.adminQuotes.find((q) => q.vendorId === "vendor-delta");
    expect(quoteDelta?.rank).toBe(4);
    // (60000 - 45000) / 45000 * 100 = 33.3%
    expect(quoteDelta?.varianceFromL1Percent).toBe(33.3);
  });

  it("should enforce blind bidding & anti-collusion in vendor live bids payload", async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue(mockRequirement as any);
    vi.mocked(prisma.quote.findUnique).mockResolvedValue({
      status: "SUBMITTED",
      newPrice: "50000.00",
    } as any);

    // Vendor Alpha views the leaderboard
    const vendorPayload = await buildVendorLiveBidsPayload("req-101", "vendor-alpha");

    expect(vendorPayload).not.toBeNull();
    expect(vendorPayload?.myRank).toBe(3);
    expect(vendorPayload?.isLeading).toBe(false);
    expect(vendorPayload?.myPrice).toBe("50000.00");
    expect(vendorPayload?.myStatus).toBe("SUBMITTED");

    // Check anti-collusion / blind bidding masking:
    // Vendor Alpha must see themselves labeled as "You", and all competitors masked as "Bidder #X"
    const youItem = vendorPayload?.leaderboard.find((b) => b.isYou);
    expect(youItem).toBeDefined();
    expect(youItem?.maskedName).toBe("You");
    expect(youItem?.price).toBe("50000.00");

    const competitorItems = vendorPayload?.leaderboard.filter((b) => !b.isYou) || [];
    expect(competitorItems.length).toBe(3);

    for (const comp of competitorItems) {
      expect(comp.maskedName).toMatch(/^Bidder #\d+$/);
      // Ensure NO company names, emails, or IDs exist on VendorAnonymizedBidItem
      expect((comp as any).who).toBeUndefined();
      expect((comp as any).vendorEmail).toBeUndefined();
      expect((comp as any).vendorId).toBeUndefined();
    }
  });

  it("should handle requirements with zero bids gracefully", async () => {
    vi.mocked(prisma.requirement.findUnique).mockResolvedValue({
      ...mockRequirement,
      quotes: [],
    } as any);

    const result = await getRequirementRankings("req-101");
    expect(result.lowestPrice).toBeNull();
    expect(result.averagePrice).toBeNull();
    expect(result.totalQuotes).toBe(0);
    expect(result.adminQuotes).toHaveLength(0);
  });
});
