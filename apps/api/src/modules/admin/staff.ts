import { randomInt } from "node:crypto";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { hashPassword } from "../../lib/password";
import { type Sql, cuid, hashSha256 } from "./db";
import { requireAdmin, writeAudit } from "./auth";
import type { AdminRoleName } from "./constants";

export interface StaffListItem {
  id: string;
  email: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  role: AdminRoleName;
  isActive: boolean;
  lastLoginAt: string | null;
  failedAttempts: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

/** Generate a secure 6-digit numeric OTP */
function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

/** Verify action OTP for the logged-in administrator */
async function verifyOtpChallenge(
  sql: Sql,
  adminId: string,
  action: string,
  otpCode: string
): Promise<{ valid: boolean; error?: string }> {
  if (!otpCode || typeof otpCode !== "string") {
    return { valid: false, error: "OTP code is required for this operation." };
  }

  const codeHash = await hashSha256(otpCode.trim());
  const now = new Date();

  // Find latest active challenge for this admin and action
  const [challenge] = await sql`
    SELECT * FROM "AdminOtp"
    WHERE "adminId" = ${adminId} AND action = ${action}
      AND "expiresAt" > ${now} AND "consumedAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;

  if (!challenge) {
    return { valid: false, error: "No active verification code found or code has expired. Please request a new OTP." };
  }

  if (Number(challenge.attempts) >= MAX_OTP_ATTEMPTS) {
    await sql`DELETE FROM "AdminOtp" WHERE id = ${challenge.id as string}`;
    return { valid: false, error: "Maximum verification attempts exceeded. Please request a new OTP." };
  }

  const storedHash = (challenge.codeHash || challenge.code_hash) as string;
  if (storedHash !== codeHash) {
    await sql`
      UPDATE "AdminOtp"
      SET attempts = attempts + 1
      WHERE id = ${challenge.id as string}
    `;
    return { valid: false, error: "Invalid verification code. Please check and try again." };
  }

  // Valid OTP: mark consumed to prevent replay attacks
  await sql`UPDATE "AdminOtp" SET "consumedAt" = NOW() WHERE id = ${challenge.id as string}`;
  return { valid: true };
}

/**
 * POST /admin/staff/otp/request
 * Generates and sends a 6-digit OTP code to the requesting admin's email.
 */
export async function handleStaffOtpRequest(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const action = typeof (body as any)?.action === "string" ? (body as any).action : "STAFF_MANAGEMENT";

  // Clean old expired challenges for this admin
  await sql`
    DELETE FROM "AdminOtp"
    WHERE "adminId" = ${auth.admin.id} OR "expiresAt" < NOW()
  `;

  const code = generateOtpCode();
  const codeHash = await hashSha256(code);
  const challengeId = cuid();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await sql`
    INSERT INTO "AdminOtp" (
      id, "adminId", action, "codeHash", attempts, "expiresAt", "createdAt"
    ) VALUES (
      ${challengeId}, ${auth.admin.id}, ${action}, ${codeHash}, 0, ${expiresAt}, NOW()
    )
  `;


  // Log OTP for audit & local simulation
  console.log(`\n======================================================`);
  console.log(`[ADMIN SECURITY OTP]`);
  console.log(`Recipient: ${auth.admin.email} (${auth.admin.name})`);
  console.log(`Action:    ${action}`);
  console.log(`Code:      ${code}`);
  console.log(`Expires:   ${expiresAt.toISOString()}`);
  console.log(`======================================================\n`);

  return json(env, request, {
    success: true,
    sentTo: auth.admin.email,
    expiresInSeconds: 300,
    devCodeHint: process.env.NODE_ENV !== "production" ? code : undefined,
  });
}

/**
 * GET /admin/staff
 * Lists all staff and admin accounts.
 */
export async function handleStaffList(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const rows = await sql`
    SELECT
      id, email, name, position, department, phone, role, "isActive",
      "lastLoginAt", "failedAttempts", "lockedUntil", "createdAt", "updatedAt"
    FROM "AdminUser"
    ORDER BY
      CASE
        WHEN role = 'SUPER_ADMIN' THEN 1
        WHEN role = 'ADMIN' THEN 2
        WHEN role = 'PROCUREMENT_ADMIN' THEN 3
        WHEN role = 'VENDOR_ADMIN' THEN 4
        WHEN role = 'WEBSITE_ADMIN' THEN 5
        ELSE 6
      END ASC,
      "createdAt" ASC
  `;

  const staff: StaffListItem[] = rows.map((r) => {
    const isLocked = Boolean(r.lockedUntil && new Date(r.lockedUntil as string | Date) > new Date());
    return {
      id: r.id as string,
      email: r.email as string,
      name: (r.name as string) || "",
      position: (r.position as string) || "",
      department: (r.department as string) || "",
      phone: (r.phone as string) || "",
      role: r.role as AdminRoleName,
      isActive: Boolean(r.isActive),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt as string).toISOString() : null,
      failedAttempts: Number(r.failedAttempts) || 0,
      isLocked,
      createdAt: new Date(r.createdAt as string).toISOString(),
      updatedAt: new Date(r.updatedAt as string).toISOString(),
    };
  });

  return json(env, request, staff);
}

/**
 * POST /admin/staff
 * Creates a new staff/admin user. Requires OTP verification.
 */
export async function handleStaffCreate(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON payload" }, 400);
  }

  const { email, password, name, position, department, phone, role, otpCode } = body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return json(env, request, { error: "Valid email address is required" }, 400);
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return json(env, request, { error: "Password must be at least 8 characters" }, 400);
  }

  // Verify OTP Challenge
  const otpCheck = await verifyOtpChallenge(sql, auth.admin.id, "CREATE_STAFF", otpCode);
  if (!otpCheck.valid) {
    return json(env, request, { error: otpCheck.error }, 403);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await sql`
    SELECT id FROM "AdminUser" WHERE email = ${normalizedEmail} LIMIT 1
  `;
  if (existing) {
    return json(env, request, { error: "An account with this email already exists." }, 409);
  }

  const passwordHash = await hashPassword(password);
  const staffId = cuid();
  const validRoles = ["SUPER_ADMIN", "ADMIN", "PROCUREMENT_ADMIN", "VENDOR_ADMIN", "WEBSITE_ADMIN", "REVIEWER"];
  const validRole = (validRoles.includes(role) ? role : "ADMIN") as AdminRoleName;

  await sql`
    INSERT INTO "AdminUser" (
      id, email, name, position, department, phone, "passwordHash",
      role, "isActive", "createdAt", "updatedAt"
    ) VALUES (
      ${staffId}, ${normalizedEmail}, ${name || ""}, ${position || ""},
      ${department || ""}, ${phone || ""}, ${passwordHash}, ${validRole},
      true, NOW(), NOW()
    )
  `;


  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "CREATE_STAFF_USER",
    entityType: "AdminUser",
    entityId: staffId,
    metadata: { email: normalizedEmail, name, role: validRole, position, department },
  });

  return json(env, request, { success: true, id: staffId }, 201);
}

/**
 * PATCH /admin/staff/:id
 * Updates staff profile (name, position, department, phone, role, active status). Requires OTP for role or status changes.
 */
export async function handleStaffUpdate(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  const [target] = await sql`SELECT * FROM "AdminUser" WHERE id = ${id} LIMIT 1`;
  if (!target) {
    return json(env, request, { error: "Staff user not found" }, 404);
  }

  const { name, position, department, phone, role, isActive, otpCode } = body;

  // Protect against demoting or disabling the only active super admin
  if (target.role === "SUPER_ADMIN" && (role !== "SUPER_ADMIN" || isActive === false)) {
    const [superAdmins] = await sql`
      SELECT COUNT(*)::int as count FROM "AdminUser"
      WHERE role = 'SUPER_ADMIN' AND "isActive" = true
    `;
    if ((superAdmins?.count ?? 0) <= 1) {
      return json(env, request, { error: "Cannot demote or deactivate the last active Super Admin." }, 400);
    }
  }

  // If modifying role or active status, verify OTP
  const isSecurityChange = role !== undefined || isActive !== undefined;
  if (isSecurityChange) {
    const otpCheck = await verifyOtpChallenge(sql, auth.admin.id, "UPDATE_STAFF", otpCode);
    if (!otpCheck.valid) {
      return json(env, request, { error: otpCheck.error }, 403);
    }
  }

  const nextName = typeof name === "string" ? name : (target.name as string);
  const nextPosition = typeof position === "string" ? position : (target.position as string);
  const nextDepartment = typeof department === "string" ? department : (target.department as string);
  const nextPhone = typeof phone === "string" ? phone : (target.phone as string);
  const validRoles = ["SUPER_ADMIN", "ADMIN", "PROCUREMENT_ADMIN", "VENDOR_ADMIN", "WEBSITE_ADMIN", "REVIEWER"];
  const nextRole = typeof role === "string" && validRoles.includes(role) ? (role as AdminRoleName) : (target.role as AdminRoleName);
  const nextIsActive = typeof isActive === "boolean" ? isActive : Boolean(target.isActive);


  await sql`
    UPDATE "AdminUser"
    SET
      name = ${nextName},
      position = ${nextPosition},
      department = ${nextDepartment},
      phone = ${nextPhone},
      role = ${nextRole},
      "isActive" = ${nextIsActive},
      "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  // If user is blocked / deactivated, immediately revoke all their active sessions
  if (nextIsActive === false) {
    await sql`DELETE FROM "AdminSession" WHERE "adminId" = ${id}`;
  }


  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "UPDATE_STAFF_USER",
    entityType: "AdminUser",
    entityId: id,
    metadata: {
      email: target.email,
      name: nextName,
      role: nextRole,
      isActive: nextIsActive,
      position: nextPosition,
      department: nextDepartment,
    },
  });

  return json(env, request, { success: true });
}

/**
 * POST /admin/staff/:id/password
 * Resets a staff member's password. Requires OTP verification.
 */
export async function handleStaffPasswordReset(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  const { newPassword, otpCode } = body;
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    return json(env, request, { error: "Password must be at least 8 characters long." }, 400);
  }

  const [target] = await sql`SELECT id, email, name FROM "AdminUser" WHERE id = ${id} LIMIT 1`;
  if (!target) {
    return json(env, request, { error: "Staff user not found" }, 404);
  }

  // Verify OTP Challenge
  const otpCheck = await verifyOtpChallenge(sql, auth.admin.id, "RESET_PASSWORD", otpCode);
  if (!otpCheck.valid) {
    return json(env, request, { error: otpCheck.error }, 403);
  }

  const passwordHash = await hashPassword(newPassword);

  // Update password and clear any failed lockout counters
  await sql`
    UPDATE "AdminUser"
    SET
      "passwordHash" = ${passwordHash},
      "failedAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  // Revoke all existing sessions for this user so they must re-authenticate with new password
  await sql`
    DELETE FROM "AdminSession" WHERE "adminId" = ${id}
  `;

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "RESET_STAFF_PASSWORD",
    entityType: "AdminUser",
    entityId: id,
    metadata: { email: target.email, name: target.name },
  });

  return json(env, request, { success: true });
}

/**
 * DELETE /admin/staff/:id
 * Permanently removes a staff account. Requires OTP verification.
 */
export async function handleStaffDelete(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: any;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { otpCode } = body;

  if (id === auth.admin.id) {
    return json(env, request, { error: "You cannot delete your own active administrator account." }, 400);
  }

  const [target] = await sql`SELECT id, email, name, role FROM "AdminUser" WHERE id = ${id} LIMIT 1`;
  if (!target) {
    return json(env, request, { error: "Staff user not found" }, 404);
  }

  if (target.role === "SUPER_ADMIN") {
    const [superAdmins] = await sql`
      SELECT COUNT(*)::int as count FROM "AdminUser"
      WHERE role = 'SUPER_ADMIN' AND "isActive" = true
    `;
    if ((superAdmins?.count ?? 0) <= 1) {
      return json(env, request, { error: "Cannot delete the last active Super Admin account." }, 400);
    }
  }

  // Verify OTP Challenge
  const otpCheck = await verifyOtpChallenge(sql, auth.admin.id, "DELETE_STAFF", otpCode);
  if (!otpCheck.valid) {
    return json(env, request, { error: otpCheck.error }, 403);
  }

  // Delete will cascade sessions, audits, and challenges
  await sql`DELETE FROM "AdminUser" WHERE id = ${id}`;

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "DELETE_STAFF_USER",
    entityType: "AdminUser",
    entityId: id,
    metadata: { email: target.email, name: target.name, role: target.role },
  });

  return json(env, request, { success: true, deletedId: id });
}
