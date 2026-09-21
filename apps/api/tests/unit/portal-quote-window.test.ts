import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../../src/config/env";
import { prisma } from "../../src/lib/prisma";
import { VendorPortalService } from "../../src/modules/vendors/portal/portal.service";

vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    requirement: { findFirst: vi.fn() },
    exchangeRate: { findUnique: vi.fn() },
    $transaction: vi.fn(),
    manualQuotation: { findFirst: vi.fn() },
  },
}));

vi.mock("../../src/modules/auth", () => ({
  writeAudit: vi.fn(),
}));

vi.mock("../../src/modules/sourcing/bidding/live-bids.controller", () => ({
  broadcastBidUpdate: vi.fn(),
}));

const env = { NODE_ENV: "test" } as Env;

function openRequirement(overrides: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    status: "OPEN",
    deletedAt: null,
    opensAt: new Date(Date.now() - 60_000),
    closesAt: new Date(Date.now() + 60_000),
    currency: "SAR",
    quantity: 1,
    allowBidRevisions: true,
    minAcceptablePrice: null,
    maxAcceptablePrice: null,
    quotes: [],
    ...overrides,
  };
}

describe("saveQuote bidding window", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.manualQuotation.findFirst).mockResolvedValue(null);
  });

  it("rejects a bid before opensAt with 409", async () => {
    vi.mocked(prisma.requirement.findFirst).mockResolvedValue(
      openRequirement({
        opensAt: new Date(Date.now() + 60_000),
        closesAt: new Date(Date.now() + 120_000),
      }) as any
    );

    const result = await VendorPortalService.saveQuote(env, "vendor-1", "req-1", {
      newPrice: 1000,
      submit: true,
    });

    expect(result).toEqual({ error: "Bidding has not started yet.", status: 409 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a bid at or after closesAt with 409", async () => {
    vi.mocked(prisma.requirement.findFirst).mockResolvedValue(
      openRequirement({
        opensAt: new Date(Date.now() - 120_000),
        closesAt: new Date(Date.now() - 1),
      }) as any
    );

    const result = await VendorPortalService.saveQuote(env, "vendor-1", "req-1", {
      newPrice: 1000,
      submit: true,
    });

    expect(result.status).toBe(409);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a live bid when an admin-attached quotation already exists", async () => {
    vi.mocked(prisma.requirement.findFirst).mockResolvedValue(openRequirement() as any);
    vi.mocked(prisma.manualQuotation.findFirst).mockResolvedValue({ id: "mq-1" } as any);

    const result = await VendorPortalService.saveQuote(env, "vendor-1", "req-1", {
      newPrice: 1000,
      submit: true,
    });

    expect(result).toEqual({
      error:
        "A quotation was already recorded for your company. Live bidding is not available on this requirement.",
      status: 409,
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
