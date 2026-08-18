import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("a vendor can belong to several industries", async () => {
  const vendor = await testPrisma.vendorUser.create({
    data: {
      email: "multi@supplier.com",
      passwordHash: "x",
      industries: {
        create: [
          { name: "Civil Works", slug: "civil-works" },
          { name: "MEP", slug: "mep" },
        ],
      },
    },
    include: { industries: true },
  });

  expect(vendor.industries.map((i) => i.slug).sort()).toEqual(["civil-works", "mep"]);
});

test("industry slugs are unique", async () => {
  await testPrisma.industry.create({ data: { name: "Civil Works", slug: "civil-works" } });

  await expect(
    testPrisma.industry.create({ data: { name: "Civil Work", slug: "civil-works" } })
  ).rejects.toThrow();
});
