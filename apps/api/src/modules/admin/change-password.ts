import { hashPassword, verifyPassword } from "../../lib/password";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { requireAdmin, writeAudit } from "./auth";
import { cuid, hashSha256 } from "./db";
import { sendAdminPasswordChangeOtp, smtpConfigured } from "../mail/mail";
import { prisma } from "../../lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_PER_HOUR = 5;

/**
 * Step 1: Reset password directly with current password (no OTP).
 */
export async function handleAdminChangePasswordWithCurrent(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const body = (await request.json()) as { currentPassword?: string; newPassword?: string } | null;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    return json(env, request, { error: "Current password is required." }, 400);
  }
  if (!newPassword || newPassword.length < 8) {
    return json(env, request, { error: "New password must be at least 8 characters." }, 400);
  }
  if (currentPassword === newPassword) {
    return json(env, request, { error: "New password must be different from current password." }, 400);
  }

  // Fetch the admin's password hash
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!adminUser) {
    return json(env, request, { error: "Account not found." }, 404);
  }

  // Verify current password
  if (!(await verifyPassword(currentPassword, adminUser.passwordHash))) {
    return json(env, request, { error: "Incorrect current password." }, 401);
  }

  // Hash and update the new password
  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  // Revoke all other sessions (keep current one)
  const currentToken = request.headers.get("X-Admin-Session");
  if (currentToken) {
    const tokenHash = await hashSha256(currentToken);
    await prisma.adminSession.updateMany({
      where: {
        adminId: admin.id,
        tokenHash: { not: tokenHash },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  } else {
    await prisma.adminSession.updateMany({
      where: {
        adminId: admin.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: "admin.password_changed",
    entityType: "AdminUser",
    entityId: admin.id,
    metadata: { method: "current_password" },
  });

  return json(env, request, { ok: true });
}

/**
 * Step 1: Send OTP to admin's email (forgot password — no current password needed).
 */
export async function handleAdminChangePasswordRequestOtp(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { id: true, email: true },
  });

  if (!adminUser) {
    return json(env, request, { error: "Account not found." }, 404);
  }

  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable." }, 503);
  }

  // Rate limit: max 5 OTPs per hour per admin
  const count = await prisma.adminOtp.count({
    where: {
      adminId: admin.id,
      action: "PASSWORD_CHANGE",
      createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (count >= OTP_MAX_PER_HOUR) {
    return json(env, request, { error: "Too many requests. Try again later." }, 429);
  }

  // Generate 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashSha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate any previous unconsumed OTPs for this admin
  await prisma.adminOtp.updateMany({
    where: {
      adminId: admin.id,
      action: "PASSWORD_CHANGE",
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.adminOtp.create({
    data: {
      id: cuid(),
      adminId: admin.id,
      action: "PASSWORD_CHANGE",
      codeHash,
      expiresAt,
    },
  });

  // Send OTP email
  try {
    await sendAdminPasswordChangeOtp(env, adminUser.email, code, 10);
  } catch (err) {
    console.error("[admin] change-password OTP mail failed", err);
    return json(env, request, { error: "Unable to send verification code." }, 500);
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: "admin.password_change_requested",
    entityType: "AdminUser",
    entityId: admin.id,
    metadata: { email: adminUser.email, method: "otp" },
  });

  return json(env, request, { ok: true, expiresInMinutes: 10 });
}

/**
 * Step 2: Verify OTP and change password.
 */
export async function handleAdminChangePasswordVerify(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const body = (await request.json()) as { code?: string; newPassword?: string } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!code || !/^\d{6}$/.test(code)) {
    return json(env, request, { error: "A 6-digit verification code is required." }, 400);
  }

  if (!newPassword || newPassword.length < 8) {
    return json(env, request, { error: "New password must be at least 8 characters." }, 400);
  }

  // Find the latest unconsumed OTP
  const codeHash = await hashSha256(code);
  const otp = await prisma.adminOtp.findFirst({
    where: {
      adminId: admin.id,
      action: "PASSWORD_CHANGE",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return json(env, request, { error: "No valid verification code found. Request a new one." }, 404);
  }

  // Timing-safe comparison
  const storedHash = otp.codeHash;
  if (storedHash.length !== codeHash.length || storedHash !== codeHash) {
    return json(env, request, { error: "Invalid verification code." }, 401);
  }

  // Mark OTP as consumed
  await prisma.adminOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  // Hash and update the new password
  const passwordHash = await hashPassword(newPassword);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  // Invalidate all active sessions
  await prisma.adminSession.updateMany({
    where: {
      adminId: admin.id,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  await writeAudit(sql, {
    adminId: admin.id,
    action: "admin.password_reset_via_otp",
    entityType: "AdminUser",
    entityId: admin.id,
    metadata: { method: "otp" },
  });

  return json(env, request, { ok: true, message: "Password updated successfully. Please sign in again." });
}
