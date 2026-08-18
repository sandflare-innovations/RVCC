import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("a vendor can exist without a supplier registration", async () => {
  const vendor = await testPrisma.vendorUser.create({
    data: { email: "direct@supplier.com", name: "Direct Supplier", passwordHash: "x" },
  });

  expect(vendor.registrationId).toBeNull();
});

test("deleting a registration keeps the vendor login alive", async () => {
  const registration = await testPrisma.supplierRegistration.create({
    data: { email: "reg@supplier.com" },
  });
  const vendor = await testPrisma.vendorUser.create({
    data: {
      email: "reg-login@supplier.com",
      passwordHash: "x",
      registrationId: registration.id,
    },
  });

  await testPrisma.supplierRegistration.delete({ where: { id: registration.id } });

  const after = await testPrisma.vendorUser.findUnique({ where: { id: vendor.id } });
  expect(after).not.toBeNull();
  expect(after?.registrationId).toBeNull();
});
