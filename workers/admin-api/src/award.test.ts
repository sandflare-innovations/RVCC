import { expect, test } from "vitest";

import { describeAward } from "./award";

const quotes = [
  { id: "q1", newPrice: "80.00", vendorEmail: "alpha@supplier.com" },
  { id: "q2", newPrice: "100.00", vendorEmail: "beta@supplier.com" },
  { id: "q3", newPrice: "90.00", vendorEmail: "gamma@supplier.com" },
];

test("records the winning price and every losing price", () => {
  const out = describeAward(quotes, "q1");

  expect(out.winner.vendorEmail).toBe("alpha@supplier.com");
  expect(out.winningPrice).toBe("80.00");
  // The losing prices are captured so the decision can be reconstructed later,
  // even if a supplier edits their quote afterwards.
  expect(out.losingPrices.sort()).toEqual(["100.00", "90.00"]);
});

test("refuses a quote that is not in the list", () => {
  expect(() => describeAward(quotes, "nope")).toThrow(/not a submitted quote/i);
});

test("refuses when there are no quotes at all", () => {
  expect(() => describeAward([], "q1")).toThrow(/not a submitted quote/i);
});

test("awarding the only quote leaves no losing prices", () => {
  const out = describeAward([quotes[0]], "q1");

  expect(out.losingPrices).toEqual([]);
});
