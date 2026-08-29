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
import { type Sql, cuid, hashSha256 } from "./db";
import { isTransientDbError } from "../../lib/sql";

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
  sql: Sql,
  email: string,
  password: string
): Promise<LoginResult> {
  const normalized = email.trim().toLowerCase();
  const [admin] = await sql`
    SELECT * FROM "AdminUser" WHERE email = ${normalized} LIMIT 1
  `;

  if (!admin) {
    await hashPassword(password);
    return { ok: false, reason: "invalid" };
  }

  if (admin.lockedUntil && new Date(admin.lockedUntil as string | Date) > new Date()) {
    return {
      ok: false,
      reason: "locked",
      retryAfterMs: new Date(admin.lockedUntil as string | Date).getTime() - Date.now(),
    };
  }

  if (!admin.isActive) return { ok: false, reason: "disabled" };

  if (!(await verifyPassword(password, admin.passwordHash as string))) {
    const failedAttempts = Number(admin.failedAttempts) + 1;
    const lock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await sql`
      UPDATE "AdminUser"
      SET "failedAttempts" = ${lock ? 0 : failedAttempts},
          "lockedUntil" = ${lock ? new Date(Date.now() + LOCKOUT_MS) : null},
          "updatedAt" = NOW()
      WHERE id = ${admin.id as string}
    `;
    return lock
      ? { ok: false, reason: "locked", retryAfterMs: LOCKOUT_MS }
      : { ok: false, reason: "invalid" };
  }

  await sql`
    UPDATE "AdminUser"
    SET "failedAttempts" = 0,
        "lockedUntil" = NULL,
        "lastLoginAt" = NOW(),
        "updatedAt" = NOW()
    WHERE id = ${admin.id as string}
  `;

  return {
    ok: true,
    adminId: admin.id as string,
    admin: {
      id: admin.id as string,
      email: admin.email as string,
      name: admin.name as string,
      role: admin.role as AdminRoleName,
    },
  };
}

export async function createAdminSession(
  sql: Sql,
  adminId: string,
  userAgent = ""
): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = await hashSha256(token);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
  await sql`
    INSERT INTO "AdminSession" (id, "tokenHash", "adminId", "userAgent", "expiresAt", "createdAt")
    VALUES (
      ${cuid()},
      ${tokenHash},
      ${adminId},
      ${userAgent.slice(0, 255)},
      ${expiresAt},
      NOW()
    )
  `;
  return token;
}

export async function getAdminFromSession(
  sql: Sql,
  token: string | null | undefined
): Promise<AdminIdentity | null> {
  if (!token) return null;

  async function lookup(): Promise<AdminIdentity | null> {
    const tokenHash = await hashSha256(token!);
    const [row] = await sql`
      SELECT
        s.id AS "sessionId",
        s."revokedAt",
        s."expiresAt",
        a.id,
        a.email,
        a.name,
        a.role,
        a."isActive"
      FROM "AdminSession" s
      JOIN "AdminUser" a ON a.id = s."adminId"
      WHERE s."tokenHash" = ${tokenHash}
      LIMIT 1
    `;
    if (!row) return null;
    if (row.revokedAt) return null;
    if (new Date(row.expiresAt as string | Date) < new Date()) return null;
    if (!row.isActive) return null;

    const expiresAtMs = new Date(row.expiresAt as string | Date).getTime();
    if (expiresAtMs - Date.now() < ADMIN_SESSION_TTL_MS / 2) {
      const sessionId = row.sessionId as string;
      void sql`
        UPDATE "AdminSession"
        SET "expiresAt" = ${new Date(Date.now() + ADMIN_SESSION_TTL_MS)}
        WHERE id = ${sessionId}
      `.catch(() => {
        /* non-fatal */
      });
    }

    return {
      id: row.id as string,
      email: row.email as string,
      name: row.name as string,
      role: row.role as AdminRoleName,
    };
  }

  try {
    return await lookup();
  } catch (err) {
    if (isTransientDbError(err)) {
      console.warn("[admin session] transient error, retrying", err);
      try {
        return await lookup();
      } catch (retryErr) {
        console.error("[admin session] lookup retry failed", retryErr);
        throw new AuthServiceError(retryErr);
      }
    }
    console.error("[admin session] lookup failed", err);
    throw new AuthServiceError(err);
  }
}

export async function revokeAdminSession(
  sql: Sql,
  token: string | null | undefined
): Promise<void> {
  if (!token) return;
  const tokenHash = await hashSha256(token);
  await sql`
    UPDATE "AdminSession"
    SET "revokedAt" = NOW()
    WHERE "tokenHash" = ${tokenHash} AND "revokedAt" IS NULL
  `.catch(() => {
    /* already gone */
  });
}

export function hasRole(role: AdminRoleName, minimum: AdminRoleName): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Fire-and-forget is deliberate: an audit write must never block the action itself. */
export async function writeAudit(
  sql: Sql,
  entry: {
    adminId: string | null;
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
    await sql`
      INSERT INTO "AuditLog" (
        id, "adminId", action, "entityType", "entityId",
        "actorName", "actorRole", "previousStatus", "newStatus", note,
        metadata, "createdAt"
      )
      VALUES (
        ${cuid()},
        ${entry.adminId},
        ${entry.action},
        ${entry.entityType},
        ${entry.entityId},
        ${entry.actorName ?? ""},
        ${entry.actorRole ?? ""},
        ${entry.previousStatus ?? null},
        ${entry.newStatus ?? null},
        ${entry.note ?? null},
        ${sql.json((entry.metadata ?? {}) as Parameters<Sql["json"]>[0])},
        NOW()
      )
    `;
  } catch (err) {
    console.error("[audit] write failed", entry.action, err);
  }
}

/**
 * Auth gate for admin API routes.
 * Session token is read from `X-Admin-Session` (raw token; DB stores SHA-256).
 */
export async function requireAdmin(
  sql: Sql,
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
      deny: json(env, request, { error: "Not signed in." }, 401),
    };
  }

  if (!hasRole(admin.role, minimum)) {
    return {
      admin: null,
      deny: json(env, request, { error: "Your role does not permit this action." }, 403),
    };
  }

  return { admin, deny: null };
}
