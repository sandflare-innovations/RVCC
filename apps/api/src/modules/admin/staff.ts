import { randomInt } from "node:crypto";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { hashPassword } from "../../lib/password";
import { cuid, hashSha256 } from "./db";
import { requireAdmin, writeAudit } from "./auth";
import type { AdminRoleName } from "./constants";
import { prisma } from "../../lib/prisma";

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
  _sql: unknown,
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
  const challenge = await prisma.adminOtp.findFirst({
    where: {
      adminId,
      action,
      expiresAt: { gt: now },
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return {
      valid: false,
      error: "No active verification code found or code has expired. Please request a new OTP.",
    };
  }

  if (Number(challenge.attempts) >= MAX_OTP_ATTEMPTS) {
    await prisma.adminOtp.delete({ where: { id: challenge.id } });
    return {
      valid: false,
      error: "Maximum verification attempts exceeded. Please request a new OTP.",
    };
  }

  if (challenge.codeHash !== codeHash) {
    await prisma.adminOtp.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { valid: false, error: "Invalid verification code. Please check and try again." };
  }

  // Valid OTP: mark consumed to prevent replay attacks
  await prisma.adminOtp.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  return { valid: true };
}

/**
 * POST /admin/staff/otp/request
 * Generates and sends a 6-digit OTP code to the requesting admin's email.
 */
export async function handleStaffOtpRequest(
  sql: unknown,
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
  const action =
    typeof (body as any)?.action === "string" ? (body as any).action : "STAFF_MANAGEMENT";

  // Clean old expired challenges for this admin
  await prisma.adminOtp.deleteMany({
    where: {
      OR: [{ adminId: auth.admin.id }, { expiresAt: { lt: new Date() } }],
    },
  });

  const code = generateOtpCode();
  const codeHash = await hashSha256(code);
  const challengeId = cuid();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.adminOtp.create({
    data: {
      id: challengeId,
      adminId: auth.admin.id,
      action,
      codeHash,
      attempts: 0,
      expiresAt,
    },
  });

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
export async function handleStaffList(sql: unknown, env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const rows = await prisma.adminUser.findMany({
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });

  const rolePriority: Record<string, number> = {
    SUPER_ADMIN: 1,
    ADMIN: 2,
    PROCUREMENT_ADMIN: 3,
    VENDOR_ADMIN: 4,
    WEBSITE_ADMIN: 5,
    REVIEWER: 6,
  };

  const sortedRows = [...rows].sort((a, b) => {
    const roleA = a.role?.name || "ADMIN";
    const roleB = b.role?.name || "ADMIN";
    const pA = rolePriority[roleA] || 99;
    const pB = rolePriority[roleB] || 99;
    return pA - pB;
  });

  const staff: StaffListItem[] = sortedRows.map((r) => {
    const isLocked = Boolean(r.lockedUntil && new Date(r.lockedUntil) > new Date());
    const roleName = (r.role?.name || "ADMIN") as AdminRoleName;
    return {
      id: r.id,
      email: r.email,
      name: r.name || "",
      position: r.position || "",
      department: r.department || "",
      phone: r.phone || "",
      role: roleName,
      isActive: Boolean(r.isActive),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : null,
      failedAttempts: Number(r.failedAttempts) || 0,
      isLocked,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    };
  });

  return json(env, request, staff);
}

/**
 * POST /admin/staff
 * Creates a new staff/admin user. Requires OTP verification.
 */
export async function handleStaffCreate(
  sql: unknown,
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
  const existing = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return json(env, request, { error: "An account with this email already exists." }, 409);
  }

  const passwordHash = await hashPassword(password);
  const staffId = cuid();
  const validRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "PROCUREMENT_ADMIN",
    "VENDOR_ADMIN",
    "WEBSITE_ADMIN",
    "REVIEWER",
  ];
  const validRole = (validRoles.includes(role) ? role : "ADMIN") as AdminRoleName;

  // Find or create role
  let roleRecord = await prisma.role.findUnique({
    where: { name: validRole },
  });

  if (!roleRecord) {
    roleRecord = await prisma.role.create({
      data: {
        name: validRole,
        description: `${validRole} Role`,
        isSystem: true,
      },
    });
  }

  await prisma.adminUser.create({
    data: {
      id: staffId,
      email: normalizedEmail,
      name: name || "",
      position: position || "",
      department: department || "",
      phone: phone || "",
      passwordHash,
      roleId: roleRecord.id,
      isActive: true,
    },
  });

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
  sql: unknown,
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

  const target = await prisma.adminUser.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!target) {
    return json(env, request, { error: "Staff user not found" }, 404);
  }

  const { name, position, department, phone, role, isActive, otpCode } = body;
  const currentRoleName = target.role?.name || "ADMIN";

  // Protect against demoting or disabling the only active super admin
  if (currentRoleName === "SUPER_ADMIN" && (role !== "SUPER_ADMIN" || isActive === false)) {
    const superAdminsCount = await prisma.adminUser.count({
      where: {
        role: { name: "SUPER_ADMIN" },
        isActive: true,
      },
    });
    if (superAdminsCount <= 1) {
      return json(
        env,
        request,
        { error: "Cannot demote or deactivate the last active Super Admin." },
        400
      );
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

  const nextName = typeof name === "string" ? name : target.name;
  const nextPosition = typeof position === "string" ? position : target.position;
  const nextDepartment = typeof department === "string" ? department : target.department;
  const nextPhone = typeof phone === "string" ? phone : target.phone;
  const validRoles = [
    "SUPER_ADMIN",
    "ADMIN",
    "PROCUREMENT_ADMIN",
    "VENDOR_ADMIN",
    "WEBSITE_ADMIN",
    "REVIEWER",
  ];
  const nextRoleName =
    typeof role === "string" && validRoles.includes(role)
      ? (role as AdminRoleName)
      : (currentRoleName as AdminRoleName);
  const nextIsActive = typeof isActive === "boolean" ? isActive : Boolean(target.isActive);

  let nextRoleId = target.roleId;
  if (role !== undefined && role !== currentRoleName) {
    const roleRecord = await prisma.role.upsert({
      where: { name: nextRoleName },
      update: {},
      create: { name: nextRoleName, description: `${nextRoleName} Role`, isSystem: true },
    });
    nextRoleId = roleRecord.id;
  }

  await prisma.adminUser.update({
    where: { id },
    data: {
      name: nextName,
      position: nextPosition,
      department: nextDepartment,
      phone: nextPhone,
      roleId: nextRoleId,
      isActive: nextIsActive,
    },
  });

  // If user is blocked / deactivated, immediately revoke all their active sessions
  if (nextIsActive === false) {
    await prisma.adminSession.deleteMany({
      where: { adminId: id },
    });
  }

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "UPDATE_STAFF_USER",
    entityType: "AdminUser",
    entityId: id,
    metadata: {
      email: target.email,
      name: nextName,
      role: nextRoleName,
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
  sql: unknown,
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

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

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
  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  // Revoke all existing sessions for this user so they must re-authenticate with new password
  await prisma.adminSession.deleteMany({
    where: { adminId: id },
  });

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
 * Removes a staff account (soft-deletes via Prisma client extension). Requires OTP verification.
 */
export async function handleStaffDelete(
  sql: unknown,
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
    return json(
      env,
      request,
      { error: "You cannot delete your own active administrator account." },
      400
    );
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!target) {
    return json(env, request, { error: "Staff user not found" }, 404);
  }

  const roleName = target.role?.name || "ADMIN";
  if (roleName === "SUPER_ADMIN") {
    const superAdminsCount = await prisma.adminUser.count({
      where: {
        role: { name: "SUPER_ADMIN" },
        isActive: true,
      },
    });
    if (superAdminsCount <= 1) {
      return json(
        env,
        request,
        { error: "Cannot delete the last active Super Admin account." },
        400
      );
    }
  }

  // Verify OTP Challenge
  const otpCheck = await verifyOtpChallenge(sql, auth.admin.id, "DELETE_STAFF", otpCode);
  if (!otpCheck.valid) {
    return json(env, request, { error: otpCheck.error }, 403);
  }

  // Delete staff user and revoke sessions
  await prisma.adminSession.deleteMany({ where: { adminId: id } });
  await prisma.adminUser.delete({ where: { id } });

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "DELETE_STAFF_USER",
    entityType: "AdminUser",
    entityId: id,
    metadata: { email: target.email, name: target.name, role: roleName },
  });

  return json(env, request, { success: true, deletedId: id });
}
