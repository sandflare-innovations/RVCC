import { beforeEach, describe, expect, it } from "vitest";

import { attemptAdminLogin } from "@/lib/auth/admin-login";
import { hashPassword } from "@/lib/auth/password";
import { resetAdminTables, testPrisma } from "@/lib/test/db";

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

describe("attemptAdminLogin", () => {
  beforeEach(async () => {
    await resetAdminTables();
  });

  it("succeeds with the right password", async () => {
    await makeAdmin();
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("is case-insensitive on email", async () => {
    await makeAdmin();
    const result = await attemptAdminLogin(testPrisma, "ADMIN@EXAMPLE.COM", PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("fails with the wrong password", async () => {
    await makeAdmin();
    const result = await attemptAdminLogin(testPrisma, EMAIL, "nope");
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("fails for an unknown email", async () => {
    const result = await attemptAdminLogin(testPrisma, "ghost@example.com", PASSWORD);
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("counts failures", async () => {
    const admin = await makeAdmin();
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    const row = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.failedAttempts).toBe(2);
  });

  it("locks after 5 failures and reports locked even with the right password", async () => {
    await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result).toEqual({ ok: false, reason: "locked" });
  });

  it("allows login again once the lock expires", async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    await testPrisma.adminUser.update({
      where: { id: admin.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result.ok).toBe(true);
  });

  it("resets the counter after a success", async () => {
    const admin = await makeAdmin();
    await attemptAdminLogin(testPrisma, EMAIL, "nope");
    await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    const row = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.failedAttempts).toBe(0);
    expect(row.lockedUntil).toBeNull();
    expect(row.lastLoginAt).not.toBeNull();
  });

  it("refuses a deactivated admin", async () => {
    await makeAdmin({ isActive: false });
    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result).toEqual({ ok: false, reason: "inactive" });
  });

  it("does not immediately re-lock after an expired lock on a single wrong password", async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    await testPrisma.adminUser.update({
      where: { id: admin.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    const result = await attemptAdminLogin(testPrisma, EMAIL, "nope");
    expect(result).toEqual({ ok: false, reason: "invalid" });

    const row = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.failedAttempts).toBe(1);
  });

  it("gives a full new allowance of attempts after a lock expires", async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    await testPrisma.adminUser.update({
      where: { id: admin.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    let result;
    for (let i = 0; i < 5; i++) {
      result = await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    expect(result).toEqual({ ok: false, reason: "locked" });
  });

  it("resets the counter after a success following an expired lock", async () => {
    const admin = await makeAdmin();
    for (let i = 0; i < 5; i++) {
      await attemptAdminLogin(testPrisma, EMAIL, "nope");
    }
    await testPrisma.adminUser.update({
      where: { id: admin.id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    const result = await attemptAdminLogin(testPrisma, EMAIL, PASSWORD);
    expect(result.ok).toBe(true);

    const row = await testPrisma.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.failedAttempts).toBe(0);
    expect(row.lockedUntil).toBeNull();
  });
});
