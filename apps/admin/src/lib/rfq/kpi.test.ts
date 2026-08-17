import { expect, test } from "vitest";

import { summariseVendorPerformance } from "./kpi";

test("response rate is quotes over invitations", () => {
  const [row] = summariseVendorPerformance([
    { email: "a@s.com", invited: 4, submitted: 3, won: 1 },
  ]);

  expect(row.responseRate).toBe(75);
  expect(row.winRate).toBe(33);
});

test("a supplier invited but never quoting scores zero, not NaN", () => {
  const [row] = summariseVendorPerformance([
    { email: "b@s.com", invited: 5, submitted: 0, won: 0 },
  ]);

  expect(row.responseRate).toBe(0);
  expect(row.winRate).toBe(0);
});

test("a supplier never invited scores zero rather than dividing by zero", () => {
  const [row] = summariseVendorPerformance([
    { email: "c@s.com", invited: 0, submitted: 0, won: 0 },
  ]);

  expect(row.responseRate).toBe(0);
  expect(Number.isFinite(row.responseRate)).toBe(true);
});

test("worst responders sort first, because they are the ones to chase", () => {
  const rows = summariseVendorPerformance([
    { email: "good@s.com", invited: 4, submitted: 4, won: 2 },
    { email: "bad@s.com", invited: 4, submitted: 1, won: 0 },
  ]);

  expect(rows[0].email).toBe("bad@s.com");
});

test("on equal response rates, the more-invited supplier comes first", () => {
  const rows = summariseVendorPerformance([
    { email: "rare@s.com", invited: 1, submitted: 0, won: 0 },
    { email: "often@s.com", invited: 9, submitted: 0, won: 0 },
  ]);

  expect(rows[0].email).toBe("often@s.com");
});
