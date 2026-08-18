import { expect, test } from "vitest";

import { generateTempPassword, hashPassword, verifyPassword } from "./password";

test("hash and verify a password", async () => {
  const hash = await hashPassword("correct horse battery");
  expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
  expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  expect(await verifyPassword("wrong", hash)).toBe(false);
});

test("rejects truncated or foreign hashes", async () => {
  expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  expect(await verifyPassword("x", "bcrypt$foo")).toBe(false);
});

test("temp passwords avoid look-alike characters", () => {
  const pwd = generateTempPassword(14);
  expect(pwd).toHaveLength(14);
  expect(pwd).not.toMatch(/[0O1lI]/);
});
