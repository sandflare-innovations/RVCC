import { beforeEach, expect, test } from "vitest";

import { resetTestDatabase, testPrisma } from "./test-support";

beforeEach(async () => {
  await resetTestDatabase();
});

test("resetTestDatabase leaves the admin table empty", async () => {
  await testPrisma.adminUser.create({
    data: { email: "a@rvcc.com", passwordHash: "x" },
  });
  await resetTestDatabase();
  expect(await testPrisma.adminUser.count()).toBe(0);
});
