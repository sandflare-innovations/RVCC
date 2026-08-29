import { hashPassword, verifyPassword } from "../../lib/password";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { requireAdmin, writeAudit } from "./auth";
import { type Sql, cuid, hashSha256 } from "./db";
import { sendAdminPasswordChangeOtp, smtpConfigured } from "../mail/mail";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_PER_HOUR = 5;

/**
 * Step 1: Reset password directly with current password (no OTP).
 */
export async function handleAdminChangePasswordWithCurrent(
  sql: Sql,
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
  const [adminUser] = await sql`
    SELECT id, email, "passwordHash" FROM "AdminUser" WHERE id = ${admin.id} LIMIT 1
  `;
  if (!adminUser) {
    return json(env, request, { error: "Account not found." }, 404);
  }

  // Verify current password
  if (!(await verifyPassword(currentPassword, adminUser.passwordHash as string))) {
    return json(env, request, { error: "Incorrect current password." }, 401);
  }

  // Hash and update the new password
  const passwordHash = await hashPassword(newPassword);
  await sql`
    UPDATE "AdminUser"
    SET "passwordHash" = ${passwordHash},
        "failedAttempts" = 0,
        "lockedUntil" = NULL,
        "updatedAt" = NOW()
    WHERE id = ${admin.id}
  `;

  // Revoke all other sessions (keep current one)
  const currentToken = request.headers.get("X-Admin-Session");
  if (currentToken) {
    const tokenHash = await hashSha256(currentToken);
    await sql`
      UPDATE "AdminSession"
      SET "revokedAt" = NOW()
      WHERE "adminId" = ${admin.id}
        AND "tokenHash" != ${tokenHash}
        AND "revokedAt" IS NULL
    `;
  } else {
    await sql`
      UPDATE "AdminSession"
      SET "revokedAt" = NOW()
      WHERE "adminId" = ${admin.id} AND "revokedAt" IS NULL
    `;
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
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const { admin, deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  // Fetch the admin's email
  const [adminUser] = await sql`
    SELECT id, email FROM "AdminUser" WHERE id = ${admin.id} LIMIT 1
  `;
  if (!adminUser) {
    return json(env, request, { error: "Account not found." }, 404);
  }

  if (!smtpConfigured(env)) {
    return json(env, request, { error: "Mail service unavailable." }, 503);
  }

  // Rate limit: max 5 OTPs per hour per admin
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM "AdminOtp"
    WHERE "adminId" = ${admin.id}
      AND action = 'PASSWORD_CHANGE'
      AND "createdAt" > NOW() - INTERVAL '1 hour'
  `;
  if (Number(count) >= OTP_MAX_PER_HOUR) {
    return json(env, request, { error: "Too many requests. Try again later." }, 429);
  }

  // Generate 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await hashSha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate any previous unconsumed OTPs for this admin
  await sql`
    UPDATE "AdminOtp" SET "consumedAt" = NOW()
    WHERE "adminId" = ${admin.id}
      AND action = 'PASSWORD_CHANGE' AND "consumedAt" IS NULL
  `;

  await sql`
    INSERT INTO "AdminOtp" (id, "adminId", action, "codeHash", "expiresAt", "createdAt")
    VALUES (${cuid()}, ${admin.id}, 'PASSWORD_CHANGE', ${codeHash}, ${expiresAt}, NOW())
  `;

  // Send OTP email
  try {
    await sendAdminPasswordChangeOtp(env, adminUser.email as string, code, 10);
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
  sql: Sql,
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
  const [otp] = await sql`
    SELECT * FROM "AdminOtp"
    WHERE "adminId" = ${admin.id}
      AND action = 'PASSWORD_CHANGE'
      AND "consumedAt" IS NULL
      AND "expiresAt" > NOW()
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (!otp) {
    return json(env, request, { error: "No valid verification code found. Request a new one." }, 404);
  }

  // Timing-safe comparison
  const storedHash = (otp.codeHash || otp.code_hash) as string;
  if (storedHash.length !== codeHash.length || storedHash !== codeHash) {
    return json(env, request, { error: "Invalid verification code." }, 401);
  }

  // Mark OTP as consumed
  await sql`UPDATE "AdminOtp" SET "consumedAt" = NOW() WHERE id = ${otp.id}`;

  // Hash and update the new password
  const passwordHash = await hashPassword(newPassword);
  await sql`
    UPDATE "AdminUser"
    SET "passwordHash" = ${passwordHash},
        "failedAttempts" = 0,
        "lockedUntil" = NULL,
        "updatedAt" = NOW()
    WHERE id = ${admin.id}
  `;

  // Revoke all other sessions (keep current one)
  const currentToken = request.headers.get("X-Admin-Session");
  if (currentToken) {
    const tokenHash = await hashSha256(currentToken);
    await sql`
      UPDATE "AdminSession"
      SET "revokedAt" = NOW()
      WHERE "adminId" = ${admin.id}
        AND "tokenHash" != ${tokenHash}
        AND "revokedAt" IS NULL
    `;
  } else {
    await sql`
      UPDATE "AdminSession"
      SET "revokedAt" = NOW()
      WHERE "adminId" = ${admin.id} AND "revokedAt" IS NULL
    `;
  }

  await writeAudit(sql, {
    adminId: admin.id,
    action: "admin.password_changed",
    entityType: "AdminUser",
    entityId: admin.id,
    metadata: { method: "otp" },
  });

  return json(env, request, { ok: true });
}
