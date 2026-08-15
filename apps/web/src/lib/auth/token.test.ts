import { describe, expect, it } from "vitest";

import { hashToken, randomToken } from "@/lib/auth/token";

describe("token", () => {
  it("hashes to 64 hex characters", async () => {
    const hash = await hashToken("some-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    expect(await hashToken("same")).toBe(await hashToken("same"));
  });

  it("differs for different input", async () => {
    expect(await hashToken("a")).not.toBe(await hashToken("b"));
  });

  it("generates 64 hex characters of randomness", () => {
    expect(randomToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not repeat", () => {
    expect(randomToken()).not.toBe(randomToken());
  });
});
