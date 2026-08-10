import "server-only";

import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "@/lib/admin/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";

export type VendorLoginResult =
  | { ok: true; vendorId: string; mustChangePassword: boolean }
  | { ok: false; reason: "invalid" | "locked" | "disabled"; retryAfterMs?: number };

/** Same shape and same anti-enumeration behaviour as the admin login. */
export async function attemptVendorLogin(
  email: string,
  password: string
): Promise<VendorLoginResult> {
  const normalized = email.trim().toLowerCase();
  const vendor = await prisma.vendorUser.findUnique({ where: { email: normalized } });

  if (!vendor) {
    await hashPassword(password); // equalise timing
    return { ok: false, reason: "invalid" };
  }

  if (vendor.lockedUntil && vendor.lockedUntil > new Date()) {
    return { ok: false, reason: "locked", retryAfterMs: vendor.lockedUntil.getTime() - Date.now() };
  }

  if (!vendor.isActive) return { ok: false, reason: "disabled" };

  if (!(await verifyPassword(password, vendor.passwordHash))) {
    const failedAttempts = vendor.failedAttempts + 1;
    const lock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.vendorUser.update({
      where: { id: vendor.id },
      data: {
        failedAttempts: lock ? 0 : failedAttempts,
        lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    });
    return lock
      ? { ok: false, reason: "locked", retryAfterMs: LOCKOUT_MS }
      : { ok: false, reason: "invalid" };
  }

  await prisma.vendorUser.update({
    where: { id: vendor.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return { ok: true, vendorId: vendor.id, mustChangePassword: vendor.mustChangePassword };
}
