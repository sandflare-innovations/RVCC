import { expect, test } from "vitest";

import { rankQuotes } from "./rank";

test("lowest price ranks first", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "100" },
    { id: "b", newPrice: "80" },
    { id: "c", newPrice: "120" },
  ]);

  expect(ranked.map((q) => [q.id, q.rank])).toEqual([
    ["b", 1],
    ["a", 2],
    ["c", 3],
  ]);
});

test("equal prices share a rank, and the next rank skips", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "80" },
    { id: "b", newPrice: "80" },
    { id: "c", newPrice: "90" },
  ]);

  expect(ranked.map((q) => q.rank)).toEqual([1, 1, 3]);
});

test("compares decimals numerically, not as strings", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "9" },
    { id: "b", newPrice: "100" },
  ]);

  expect(ranked[0].id).toBe("a");
});

test("keeps precision that a float would lose", () => {
  const ranked = rankQuotes([
    { id: "a", newPrice: "1234567.89" },
    { id: "b", newPrice: "1234567.88" },
  ]);

  expect(ranked[0].id).toBe("b");
  expect(ranked[0].newPrice).toBe("1234567.88");
});

test("an empty list ranks to an empty list", () => {
  expect(rankQuotes([])).toEqual([]);
});

test("does not mutate the input array", () => {
  const input = [
    { id: "a", newPrice: "100" },
    { id: "b", newPrice: "80" },
  ];
  rankQuotes(input);

  expect(input.map((q) => q.id)).toEqual(["a", "b"]);
});
