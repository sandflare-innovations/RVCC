import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

async function anAdmin() {
  return testPrisma.adminUser.create({
    data: { email: `admin-${Date.now()}-${Math.random()}@rvcc.com`, passwordHash: "x" },
  });
}

async function aRequirement() {
  const admin = await anAdmin();
  return testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
    },
  });
}

test("a requirement stores money as Decimal, not float", async () => {
  const admin = await anAdmin();
  const requirement = await testPrisma.requirement.create({
    data: {
      scopeOfWork: "Retaining wall",
      project: "Riyadh Plot 12",
      sellingPrice: "1234567.89",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
    },
  });

  // A float would come back as 1234567.8899999999.
  expect(requirement.sellingPrice?.toString()).toBe("1234567.89");
});

test("the same vendor cannot be invited to one requirement twice", async () => {
  const requirement = await aRequirement();
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "dup@supplier.com", passwordHash: "x" },
  });

  await testPrisma.requirementInvite.create({
    data: { requirementId: requirement.id, vendorUserId: vendor.id },
  });

  await expect(
    testPrisma.requirementInvite.create({
      data: { requirementId: requirement.id, vendorUserId: vendor.id },
    })
  ).rejects.toThrow();
});

test("an invite must name a vendor", async () => {
  const requirement = await aRequirement();

  // vendorUserId is required, so a participant-less invite cannot be created.
  await expect(
    // @ts-expect-error deliberately omitting the required vendor
    testPrisma.requirementInvite.create({ data: { requirementId: requirement.id } })
  ).rejects.toThrow();
});
