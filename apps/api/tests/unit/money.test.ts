import { describe, expect, it } from "vitest";
import { computeMoneyBreakdown, toSarAmount } from "../../src/modules/sourcing/lib/money";

describe("VAT-aware procurement totals", () => {
  it("adds VAT on top of quantity * unit price", () => {
    const money = computeMoneyBreakdown({ unitPrice: 100, quantity: 10, vatRate: 15 });
    expect(money.lineTotal).toBe(1000);
    expect(money.vatAmount).toBe(150);
    expect(money.totalPrice).toBe(1150);
  });

  it("converts to SAR using the exchange rate", () => {
    expect(toSarAmount(100, 3.75)).toBe(375);
  });
});
