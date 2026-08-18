import { expect, test } from "vitest";

import { describeDeadline } from "./deadline";

const NOW = new Date("2026-08-17T12:00:00Z");

function inHours(h: number) {
  return new Date(NOW.getTime() + h * 3_600_000);
}

test("a deadline inside 48 hours is urgent", () => {
  const d = describeDeadline(inHours(18), NOW);
  expect(d.label).toBe("18h left");
  expect(d.urgent).toBe(true);
  expect(d.closed).toBe(false);
});

test("a deadline beyond 48 hours reads in days and is not urgent", () => {
  const d = describeDeadline(inHours(72), NOW);
  expect(d.label).toBe("3d left");
  expect(d.urgent).toBe(false);
});

test("exactly 48 hours is still urgent", () => {
  // The boundary decides whether a supplier sees the warning at all, so it is
  // pinned rather than left to whichever comparison someone types next.
  expect(describeDeadline(inHours(48), NOW).urgent).toBe(true);
});

test("a passed deadline reads as closed, not as negative time", () => {
  const d = describeDeadline(inHours(-3), NOW);
  expect(d.label).toBe("Closed");
  expect(d.closed).toBe(true);
  expect(d.urgent).toBe(false);
});

test("an ISO string is accepted, because worker payloads are JSON", () => {
  expect(describeDeadline(inHours(5).toISOString(), NOW).label).toBe("5h left");
});
