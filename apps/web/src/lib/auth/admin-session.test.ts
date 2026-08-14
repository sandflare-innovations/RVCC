import { beforeEach, describe, expect, it } from "vitest";

import {
  createAdminSession,
  findAdminBySessionToken,
  hashToken,
  revokeAdminSession,
} from "@/lib/auth/admin-session";
import { resetAdminTables, testPrisma } from "@/lib/test/db";

async function makeAdmin() {
  return testPrisma.adminUser.create({
    data: { email: "a@example.com", name: "A", passwordHash: "x" },
  });
}

describe("admin sessions", () => {
  beforeEach(async () => {
    await resetAdminTables();
  });

  it("finds the admin from a fresh token", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    const found = await findAdminBySessionToken(testPrisma, token);
    expect(found?.id).toBe(admin.id);
  });

  it("stores the hash, never the raw token", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    const row = await testPrisma.adminSession.findFirst();
    expect(row?.tokenHash).toBe(await hashToken(token));
    expect(row?.tokenHash).not.toBe(token);
  });

  it("rejects an unknown token", async () => {
    expect(await findAdminBySessionToken(testPrisma, "made-up")).toBeNull();
  });

  it("rejects an expired session", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    await testPrisma.adminSession.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await findAdminBySessionToken(testPrisma, token)).toBeNull();
  });

  it("rejects a session belonging to a deactivated admin", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    await testPrisma.adminUser.update({ where: { id: admin.id }, data: { isActive: false } });
    expect(await findAdminBySessionToken(testPrisma, token)).toBeNull();
  });

  it("stops working after revoke", async () => {
    const admin = await makeAdmin();
    const token = await createAdminSession(testPrisma, admin.id);
    await revokeAdminSession(testPrisma, token);
    expect(await findAdminBySessionToken(testPrisma, token)).toBeNull();
  });
});
