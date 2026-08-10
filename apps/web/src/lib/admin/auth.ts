import "server-only";

import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "@/lib/admin/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

export type LoginResult =
  | { ok: true; adminId: string }
  | { ok: false; reason: "invalid" | "locked" | "disabled"; retryAfterMs?: number };

/**
 * Always returns the same generic failure for a bad email and a bad password so
 * the response cannot be used to enumerate valid admin accounts.
 */
export async function attemptAdminLogin(email: string, password: string): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email: normalized } });

  if (!admin) {
    // Burn comparable time so a missing account is not detectable by timing.
    await hashPassword(password);
    return { ok: false, reason: "invalid" };
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return {
      ok: false,
      reason: "locked",
      retryAfterMs: admin.lockedUntil.getTime() - Date.now(),
    };
  }

  if (!admin.isActive) return { ok: false, reason: "disabled" };

  if (!(await verifyPassword(password, admin.passwordHash))) {
    const failedAttempts = admin.failedAttempts + 1;
    const lock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedAttempts: lock ? 0 : failedAttempts,
        lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    });
    return lock
      ? { ok: false, reason: "locked", retryAfterMs: LOCKOUT_MS }
      : { ok: false, reason: "invalid" };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return { ok: true, adminId: admin.id };
}
