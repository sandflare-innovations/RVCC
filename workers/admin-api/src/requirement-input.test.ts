import { expect, test } from "vitest";

import { makeReferenceNumber, normaliseRequirementInput } from "./requirement-input";

const future = new Date(Date.now() + 86_400_000).toISOString();

test("trims text and keeps the price as a string", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "  Retaining wall  ",
    project: "  Riyadh Plot 12 ",
    sellingPrice: "1234567.89",
    closesAt: future,
    vendorUserIds: [],
  });

  expect(out.scopeOfWork).toBe("Retaining wall");
  expect(out.project).toBe("Riyadh Plot 12");
  // Kept as a string so NUMERIC precision survives the trip to Postgres.
  expect(out.sellingPrice).toBe("1234567.89");
});

test("rejects a missing scope or project by naming the field", () => {
  expect(() =>
    normaliseRequirementInput({
      scopeOfWork: "  ",
      project: "P",
      closesAt: future,
      vendorUserIds: [],
    })
  ).toThrow(/scope/i);

  expect(() =>
    normaliseRequirementInput({
      scopeOfWork: "S",
      project: " ",
      closesAt: future,
      vendorUserIds: [],
    })
  ).toThrow(/project/i);
});

test("rejects a closing time in the past", () => {
  expect(() =>
    normaliseRequirementInput({
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() - 1000).toISOString(),
      vendorUserIds: [],
    })
  ).toThrow(/future/i);
});

test("rejects a price that is not money", () => {
  expect(() =>
    normaliseRequirementInput({
      scopeOfWork: "S",
      project: "P",
      sellingPrice: "12.345",
      closesAt: future,
      vendorUserIds: [],
    })
  ).toThrow(/decimals/i);
});

test("a missing selling price is allowed", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "S",
    project: "P",
    closesAt: future,
    vendorUserIds: [],
  });

  expect(out.sellingPrice).toBeNull();
});

test("keeps the invited vendor ids", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "S",
    project: "P",
    closesAt: future,
    vendorUserIds: ["vu1", "vu2"],
  });

  expect(out.vendorUserIds).toEqual(["vu1", "vu2"]);
});

test("a malformed vendor list becomes an empty one rather than throwing", () => {
  const out = normaliseRequirementInput({
    scopeOfWork: "S",
    project: "P",
    closesAt: future,
    // @ts-expect-error deliberately wrong shape
    vendorUserIds: null,
  });

  expect(out.vendorUserIds).toEqual([]);
});

test("reference numbers follow REQ-YYYYMMDD-NNNN", () => {
  expect(makeReferenceNumber(new Date("2026-09-05T10:00:00Z"), 7)).toBe("REQ-20260905-0007");
});
