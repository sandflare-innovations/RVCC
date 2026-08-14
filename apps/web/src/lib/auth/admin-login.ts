import type { AdminUser, PrismaClient } from "@prisma/client";

import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";

export type AdminLoginResult =
  { ok: true; admin: AdminUser } | { ok: false; reason: "invalid" | "locked" | "inactive" };

export async function attemptAdminLogin(
  prisma: PrismaClient,
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) return { ok: false, reason: "invalid" };
  if (!admin.isActive) return { ok: false, reason: "inactive" };

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
