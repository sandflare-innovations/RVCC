import { expect, test } from "vitest";

import { type VendorRequirementRow, summariseVendorDashboard } from "./vendor-dashboard";

const NOW = new Date("2026-08-17T12:00:00Z");

function row(over: Partial<VendorRequirementRow> = {}): VendorRequirementRow {
  return {
    id: "r1",
    referenceNumber: "REQ-001",
    project: "Site works",
    closesAt: new Date(NOW.getTime() + 240 * 3_600_000).toISOString(),
    quoteStatus: null,
    ...over,
  };
}

test("counts split by quote state", () => {
  const { counts } = summariseVendorDashboard({
    requirements: [
      row({ id: "a", quoteStatus: null }),
      row({ id: "b", quoteStatus: "DRAFT" }),
      row({ id: "c", quoteStatus: "SUBMITTED" }),
      row({ id: "d", quoteStatus: "SUBMITTED" }),
    ],
    now: NOW,
  });

  expect(counts.open).toBe(4);
  expect(counts.drafts).toBe(1);
  expect(counts.submitted).toBe(2);
});

test("due soon counts only unsubmitted work inside 48 hours", () => {
  // A quote already submitted is not work due — counting it would send a
  // supplier back to a form they have already finished.
  const soon = new Date(NOW.getTime() + 10 * 3_600_000).toISOString();
  const { counts } = summariseVendorDashboard({
    requirements: [
      row({ id: "a", closesAt: soon, quoteStatus: null }),
      row({ id: "b", closesAt: soon, quoteStatus: "DRAFT" }),
      row({ id: "c", closesAt: soon, quoteStatus: "SUBMITTED" }),
    ],
    now: NOW,
  });

  expect(counts.dueSoon).toBe(2);
});

test("next actions are the three nearest deadlines, soonest first", () => {
  const at = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();
  const { nextActions } = summariseVendorDashboard({
    requirements: [
      row({ id: "far", closesAt: at(200) }),
      row({ id: "near", closesAt: at(5) }),
      row({ id: "mid", closesAt: at(50) }),
      row({ id: "furthest", closesAt: at(400) }),
    ],
    now: NOW,
  });

  expect(nextActions.map((a) => a.id)).toEqual(["near", "mid", "far"]);
});

test("the action reflects what the supplier has already done", () => {
  const { nextActions } = summariseVendorDashboard({
    requirements: [
      row({ id: "a", quoteStatus: null }),
      row({ id: "b", quoteStatus: "DRAFT" }),
      row({ id: "c", quoteStatus: "SUBMITTED" }),
    ],
    now: NOW,
  });

  const by = Object.fromEntries(nextActions.map((a) => [a.id, a]));
  expect(by.a!.action).toBe("SUBMIT");
  expect(by.a!.actionLabel).toBe("Submit quote");
  expect(by.b!.action).toBe("CONTINUE");
  expect(by.b!.actionLabel).toBe("Continue draft");
  expect(by.c!.action).toBe("VIEW");
  expect(by.c!.actionLabel).toBe("View quote");
});

test("a supplier with nothing open gets empty counts, not a crash", () => {
  const { counts, nextActions } = summariseVendorDashboard({ requirements: [], now: NOW });
  expect(counts).toEqual({ open: 0, dueSoon: 0, submitted: 0, drafts: 0 });
  expect(nextActions).toEqual([]);
});
