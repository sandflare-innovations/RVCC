import { describe, expect, it } from "vitest";
import { isBiddingLive, negotiationPhase } from "../../src/modules/sourcing/lib/status-machine";
import { manualQuotationSchema } from "@rvcc/schemas";

describe("bidding window", () => {
  it("treats OPEN before opensAt as not live", () => {
    const opensAt = new Date(Date.now() + 60_000);
    const closesAt = new Date(Date.now() + 120_000);
    expect(isBiddingLive("OPEN", opensAt, closesAt)).toBe(false);
    expect(negotiationPhase("OPEN", opensAt, closesAt)).toBe("SCHEDULED");
  });

  it("treats OPEN inside the window as live", () => {
    const opensAt = new Date(Date.now() - 60_000);
    const closesAt = new Date(Date.now() + 60_000);
    expect(isBiddingLive("OPEN", opensAt, closesAt)).toBe(true);
    expect(negotiationPhase("OPEN", opensAt, closesAt)).toBe("LIVE");
  });

  it("treats OPEN after closesAt as closed", () => {
    const opensAt = new Date(Date.now() - 120_000);
    const closesAt = new Date(Date.now() - 1_000);
    expect(isBiddingLive("OPEN", opensAt, closesAt)).toBe(false);
    expect(negotiationPhase("OPEN", opensAt, closesAt)).toBe("CLOSED");
  });
});

describe("manual quotation mapping", () => {
  it("requires a registered vendorUserId", () => {
    const parsed = manualQuotationSchema.safeParse({
      supplierName: "Acme",
      unitPrice: 10,
    });
    expect(parsed.success).toBe(false);
  });
});
