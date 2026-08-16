import { expect, test } from "vitest";

import { generateTempPassword, hashPassword, verifyPassword } from "./password";
import { normaliseVendorInput } from "./vendor-input";

test("normalises email casing and whitespace", () => {
  const out = normaliseVendorInput({ email: "  New@Supplier.COM ", name: "  New Supplier  " });

  // Without this, "New@..." becomes a second account alongside "new@...".
  expect(out.email).toBe("new@supplier.com");
  expect(out.name).toBe("New Supplier");
});

test("rejects a missing email by naming the field", () => {
  expect(() => normaliseVendorInput({ email: "   ", name: "X" })).toThrow(/email/i);
});

test("rejects a missing name by naming the field", () => {
  expect(() => normaliseVendorInput({ email: "a@b.com", name: "  " })).toThrow(/name/i);
});

test("defaults the optional fields rather than passing undefined to SQL", () => {
  const out = normaliseVendorInput({ email: "a@b.com", name: "A" });

  expect(out.company).toBe("");
  expect(out.phone).toBe("");
  expect(out.industryIds).toEqual([]);
});

test("a generated temporary password verifies against its own hash", async () => {
  const temp = generateTempPassword();

  expect(await verifyPassword(temp, await hashPassword(temp))).toBe(true);
});
