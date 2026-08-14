import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("verifies a correct password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("correct horse battery");
    expect(await verifyPassword("wrong password", stored)).toBe(false);
  });

  it("produces a different hash each time for the same password", async () => {
    const a = await hashPassword("same password");
    const b = await hashPassword("same password");
    expect(a).not.toBe(b);
  });

  it("uses the documented format", async () => {
    const stored = await hashPassword("whatever");
    expect(stored.startsWith("pbkdf2$sha256$210000$")).toBe(true);
    expect(stored.split("$")).toHaveLength(5);
  });

  it("returns false for a malformed stored value instead of throwing", async () => {
    expect(await verifyPassword("whatever", "not-a-real-hash")).toBe(false);
  });
});
