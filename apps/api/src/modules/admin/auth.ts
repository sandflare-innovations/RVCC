import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "../../lib/password";
import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import {
  ADMIN_SESSION_TTL_MS,
  type AdminRoleName,
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  ROLE_RANK,
} from "./constants";
import { hashSha256 } from "./db";
import { prisma } from "../../lib/prisma";
import type { Prisma } from "@prisma/client";

export class AuthServiceError extends Error {
  constructor(cause?: unknown) {
    super("Session lookup temporarily unavailable");
    this.name = "AuthServiceError";
    this.cause = cause;
  }
}

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

export type LoginResult =
  | { ok: true; adminId: string; admin: AdminIdentity }
  | { ok: false; reason: "invalid" | "locked" | "disabled"; retryAfterMs?: number };

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Always returns the same generic failure for a bad email and a bad password so
 * the response cannot be used to enumerate valid admin accounts.
 */
export async function attemptAdminLogin(
  _sql: unknown,
  email: string,
  password: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const ip = meta?.ipAddress || "127.0.0.1";
  const userAgent = meta?.userAgent || "";

  const admin = await prisma.adminUser.findUnique({
    where: { email: normalized },
    include: { role: true },
  });

  if (!admin) {
    await hashPassword(password);
    return { ok: false, reason: "invalid" };
  }

  if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
    void prisma.adminLoginHistory
      .create({
        data: {
          adminId: admin.id,
          ipAddress: ip,
          userAgent,
          status: "FAILED",
          failureReason: "ACCOUNT_LOCKED",
        },
      })
      .catch(() => {});

    return {
      ok: false,
      reason: "locked",
      retryAfterMs: new Date(admin.lockedUntil).getTime() - Date.now(),
    };
  }

  if (!admin.isActive) {
    void prisma.adminLoginHistory
      .create({
        data: {
          adminId: admin.id,
          ipAddress: ip,
          userAgent,
          status: "FAILED",
          failureReason: "ACCOUNT_DISABLED",
        },
      })
      .catch(() => {});

    return { ok: false, reason: "disabled" };
  }

  if (!(await verifyPassword(password, admin.passwordHash))) {
    const failedAttempts = Number(admin.failedAttempts) + 1;
    const lock = failedAttempts >= MAX_FAILED_ATTEMPTS;

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedAttempts: lock ? 0 : failedAttempts,
        lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    });

    void prisma.adminLoginHistory
      .create({
        data: {
          adminId: admin.id,
          ipAddress: ip,
          userAgent,
          status: "FAILED",
          failureReason: "INVALID_PASSWORD",
        },
      })
      .catch(() => {});

    return lock
      ? { ok: false, reason: "locked", retryAfterMs: LOCKOUT_MS }
      : { ok: false, reason: "invalid" };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  void prisma.adminLoginHistory
    .create({
      data: {
        adminId: admin.id,
        ipAddress: ip,
        userAgent,
        status: "SUCCESS",
        failureReason: null,
      },
    })
    .catch(() => {});

  const roleName = (admin.role?.name || "ADMIN") as AdminRoleName;

  return {
    ok: true,
    adminId: admin.id,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: roleName,
    },
  };
}

export async function createAdminSession(
  _sql: unknown,
  adminId: string,
  userAgent = ""
): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = await hashSha256(token);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      adminId,
      userAgent: userAgent.slice(0, 255),
      expiresAt,
    },
  });

  return token;
}

export async function getAdminFromSession(
  _sql: unknown,
  token: string | null | undefined
): Promise<AdminIdentity | null> {
  if (!token) return null;

  try {
    const tokenHash = await hashSha256(token);
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: {
        admin: {
          include: { role: true },
        },
      },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (new Date(session.expiresAt) < new Date()) return null;
    if (!session.admin || !session.admin.isActive) return null;

    const expiresAtMs = new Date(session.expiresAt).getTime();
    if (expiresAtMs - Date.now() < ADMIN_SESSION_TTL_MS / 2) {
      void prisma.adminSession
        .update({
          where: { id: session.id },
          data: {
            expiresAt: new Date(Date.now() + ADMIN_SESSION_TTL_MS),
          },
        })
        .catch(() => {});
    }

    const roleName = (session.admin.role?.name || "ADMIN") as AdminRoleName;

    return {
      id: session.admin.id,
      email: session.admin.email,
      name: session.admin.name,
      role: roleName,
    };
  } catch (err) {
    throw new AuthServiceError(err);
  }
}

export async function revokeAdminSession(
  _sql: unknown,
  token: string | null | undefined
): Promise<void> {
  if (!token) return;
  try {
    const tokenHash = await hashSha256(token);
    await prisma.adminSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    /* already gone */
  }
}

export function hasRole(role: AdminRoleName, minimum: AdminRoleName): boolean {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minimum] ?? 0);
}

/** Fire-and-forget is deliberate: an audit write must never block the action itself. */
export async function writeAudit(
  _sql: unknown,
  entry: {
    adminId?: string | null;
    vendorId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    actorName?: string;
    actorRole?: string;
    previousStatus?: string | null;
    newStatus?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: entry.adminId ?? null,
        vendorId: entry.vendorId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorName: entry.actorName ?? "",
        actorRole: entry.actorRole ?? "",
        previousStatus: entry.previousStatus ?? null,
        newStatus: entry.newStatus ?? null,
        note: entry.note ?? null,
        metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[audit] write failed", entry.action, err);
  }
}

/**
 * Auth gate for admin API routes.
 * Session token is read from `X-Admin-Session` (raw token; DB stores SHA-256).
 */
export async function requireAdmin(
  sql: unknown,
  env: Env,
  request: Request,
  minimum: AdminRoleName = "ADMIN"
): Promise<{ admin: AdminIdentity; deny: null } | { admin: null; deny: Response }> {
  const token = request.headers.get("X-Admin-Session");
  if (!token) {
    return {
      admin: null,
      deny: json(env, request, { error: "Not signed in." }, 401),
    };
  }

  let admin: AdminIdentity | null;
  try {
    admin = await getAdminFromSession(sql, token);
  } catch (err) {
    if (err instanceof AuthServiceError) {
      return {
        admin: null,
        deny: json(env, request, { error: "Service temporarily unavailable." }, 503),
      };
    }
    throw err;
  }

  if (!admin) {
    return {
      admin: null,
      deny: json(env, request, { error: "Session expired or invalid." }, 401),
    };
  }

  if (!hasRole(admin.role, minimum)) {
    return {
      admin: null,
      deny: json(env, request, { error: "Forbidden: insufficient permissions." }, 403),
    };
  }

  return { admin, deny: null };
}
