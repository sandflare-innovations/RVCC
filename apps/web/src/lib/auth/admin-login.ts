import type { AdminUser, PrismaClient } from "@prisma/client";

import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";

export type AdminLoginResult =
  { ok: true; admin: AdminUser } | { ok: false; reason: "invalid" | "locked" | "inactive" };

/**
 * A valid, well-formed PBKDF2 hash of a random password nobody knows. Used to pay the same
 * KDF cost on the unknown-email and inactive paths as a real wrong-password attempt, so
 * response timing does not reveal whether an email exists.
 */
const DUMMY_HASH =
  "pbkdf2$sha256$210000$4S28bOpLFdjDGiUCjS1yXg==$/6kT/22MfZFIpZ76x3SFZgx2lY6sYow06T8PtSV5BGU=";

export async function attemptAdminLogin(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) {
    await verifyPassword(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }
  if (!admin.isActive) {
    await verifyPassword(password, DUMMY_HASH);
    return { ok: false, reason: "inactive" };
  }

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  if (!(await verifyPassword(password, admin.passwordHash))) {
    const failedAttempts = admin.failedAttempts + 1;
    const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MS) : admin.lockedUntil,
      },
    });
    return { ok: false, reason: shouldLock ? "locked" : "invalid" };
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  return { ok: true, admin: updated };
}
