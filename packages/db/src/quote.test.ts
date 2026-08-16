import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

async function aRequirement() {
  const admin = await testPrisma.adminUser.create({
    data: { email: `admin-${Date.now()}-${Math.random()}@rvcc.com`, passwordHash: "x" },
  });
  return testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
      status: "OPEN",
    },
  });
}

test("a submitted quote must carry a positive price", async () => {
  const requirement = await aRequirement();
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "a@supplier.com", passwordHash: "x" },
  });

  await expect(
    testPrisma.quote.create({
      data: { requirementId: requirement.id, vendorUserId: vendor.id, status: "SUBMITTED" },
    })
  ).rejects.toThrow();

  await expect(
    testPrisma.quote.create({
      data: {
        requirementId: requirement.id,
        vendorUserId: vendor.id,
        status: "SUBMITTED",
        newPrice: "0",
      },
    })
  ).rejects.toThrow();
});

test("a draft quote may have no price yet", async () => {
  const requirement = await aRequirement();
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "draft@supplier.com", passwordHash: "x" },
  });

  const quote = await testPrisma.quote.create({
    data: { requirementId: requirement.id, vendorUserId: vendor.id },
  });

  expect(quote.status).toBe("DRAFT");
  expect(quote.newPrice).toBeNull();
});

test("one quote per participant per requirement", async () => {
  const requirement = await aRequirement();
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "one@supplier.com", passwordHash: "x" },
  });

  await testPrisma.quote.create({
    data: { requirementId: requirement.id, vendorUserId: vendor.id },
  });

  // The unique constraint is what makes a double-clicked submit an upsert
  // rather than two competing quotes.
  await expect(
    testPrisma.quote.create({ data: { requirementId: requirement.id, vendorUserId: vendor.id } })
  ).rejects.toThrow();
});
