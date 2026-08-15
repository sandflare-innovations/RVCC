import { beforeEach, describe, expect, it, vi } from "vitest";

import { attemptAdminLogin } from "@/lib/auth/admin-login";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { resetAdminTables, testPrisma } from "@/lib/test/db";

vi.mock("@/lib/auth/password", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/password")>("@/lib/auth/password");
  return {
    ...actual,
    verifyPassword: vi.fn(actual.verifyPassword),
  };
});

const EMAIL = "admin@example.com";
const PASSWORD = "a-good-password";

async function makeAdmin(overrides: Record<string, unknown> = {}) {
  return testPrisma.adminUser.create({
    data: {
      email: EMAIL,
      name: "Admin",
      passwordHash: await hashPassword(PASSWORD),
      ...overrides,
    },
  });
}

describe("attemptAdminLogin timing-leak resistance", () => {
  beforeEach(async () => {
    await resetAdminTables();
    vi.mocked(verifyPassword).mockClear();
  });

  it("hashes against a dummy hash for an unknown email", async () => {
    await attemptAdminLogin(testPrisma, "ghost@example.com", PASSWORD);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it("hashes against a dummy hash for a deactivated admin", async () => {
    await makeAdmin({ isActive: false });
    await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it("hashes exactly once for a real wrong-password attempt, same as the leak paths", async () => {
    await makeAdmin();
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it("does not hash when the account is locked", async () => {
    const admin = await makeAdmin();
    await testPrisma.adminUser.update({
      where: { id: admin.id },
      data: { failedAttempts: 5, lockedUntil: new Date(Date.now() + 60_000) },
    });
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result).toEqual({ ok: false, reason: "locked" });
    expect(verifyPassword).not.toHaveBeenCalled();
  });
});

describe("DUMMY_HASH well-formedness", () => {
  it("resolves to false rather than throwing", async () => {
    const { verifyPassword: realVerify } =
      await vi.importActual<typeof import("@/lib/auth/password")>("@/lib/auth/password");
    const DUMMY_HASH =
      "pbkdf2$sha256$210000$4S28bOpLFdjDGiUCjS1yXg==$/6kT/22MfZFIpZ76x3SFZgx2lY6sYow06T8PtSV5BGU=";
    await expect(realVerify("anything", DUMMY_HASH)).resolves.toBe(false);
  });
});
