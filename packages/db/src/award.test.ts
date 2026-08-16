import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

async function setup() {
  const admin = await testPrisma.adminUser.create({
    data: { email: `a-${Date.now()}-${Math.random()}@rvcc.com`, passwordHash: "x" },
  });
  const requirement = await testPrisma.requirement.create({
    data: {
      scopeOfWork: "S",
      project: "P",
      closesAt: new Date(Date.now() + 86_400_000),
      createdByAdminId: admin.id,
      status: "OPEN",
    },
  });
  const vendor = await testPrisma.vendorUser.create({
    data: { email: `v-${Math.random()}@supplier.com`, passwordHash: "x" },
  });
  const quote = await testPrisma.quote.create({
    data: {
      requirementId: requirement.id,
      vendorUserId: vendor.id,
      newPrice: "80",
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  return { admin, requirement, vendor, quote };
}

test("a requirement records which quote won, when and by whom", async () => {
  const { admin, requirement, quote } = await setup();

  const awarded = await testPrisma.requirement.update({
    where: { id: requirement.id },
    data: {
      awardedQuoteId: quote.id,
      awardedAt: new Date(),
      awardedByAdminId: admin.id,
      status: "AWARDED",
    },
  });

  expect(awarded.status).toBe("AWARDED");
  expect(awarded.awardedQuoteId).toBe(quote.id);
});

test("one quote cannot win two requirements", async () => {
  const first = await setup();
  const second = await setup();

  await testPrisma.requirement.update({
    where: { id: first.requirement.id },
    data: { awardedQuoteId: first.quote.id },
  });

  // awardedQuoteId is @unique, so a quote is claimable exactly once.
  await expect(
    testPrisma.requirement.update({
      where: { id: second.requirement.id },
      data: { awardedQuoteId: first.quote.id },
    })
  ).rejects.toThrow();
});

test("a notification belongs to a vendor or an admin, and starts unread", async () => {
  const { admin, vendor, requirement } = await setup();

  const forVendor = await testPrisma.notification.create({
    data: {
      vendorUserId: vendor.id,
      type: "QUOTE_AWARDED",
      title: "You won",
      body: "Congratulations",
      linkPath: `/requirements/${requirement.id}`,
    },
  });
  const forAdmin = await testPrisma.notification.create({
    data: {
      adminId: admin.id,
      type: "QUOTE_SUBMITTED",
      title: "New quote",
      body: "A supplier quoted",
      linkPath: `/requirements/${requirement.id}`,
    },
  });

  expect(forVendor.readAt).toBeNull();
  expect(forAdmin.readAt).toBeNull();
});

test("deleting a vendor takes their notifications with it", async () => {
  const { vendor, requirement } = await setup();
  await testPrisma.notification.create({
    data: {
      vendorUserId: vendor.id,
      type: "REQUIREMENT_POSTED",
      title: "New work",
      body: "",
      linkPath: `/requirements/${requirement.id}`,
    },
  });

  await testPrisma.vendorUser.delete({ where: { id: vendor.id } });

  expect(await testPrisma.notification.count()).toBe(0);
});
