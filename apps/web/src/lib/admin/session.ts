import { cookies } from "next/headers";

import { createHash, randomBytes } from "node:crypto";
import "server-only";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_MS,
  type AdminRoleName,
  ROLE_RANK,
} from "@/lib/admin/constants";
import { prisma } from "@/lib/db";

/** Mirrors lib/enquire-session.ts — only the hash is persisted. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createAdminSession(adminId: string, userAgent = "") {
  const token = generateSessionToken();
  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminId,
      userAgent: userAgent.slice(0, 255),
      expiresAt: new Date(Date.now() + ADMIN_SESSION_TTL_MS),
    },
  });
  return token;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
  };
}

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: AdminRoleName;
};

/**
 * Authoritative check. Middleware only sees whether a cookie exists; this is
 * what actually proves the session is live, unrevoked and unexpired.
 */
export async function getAdminFromSession(): Promise<AdminIdentity | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.admin.isActive) return null;

  return {
    id: session.admin.id,
    email: session.admin.email,
    name: session.admin.name,
    role: session.admin.role as AdminRoleName,
  };
}

export async function revokeAdminSession(token: string | undefined) {
  if (!token) return;
  await prisma.adminSession
    .update({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } })
    .catch(() => {
      /* already gone — nothing to revoke */
    });
}

export function hasRole(role: AdminRoleName, minimum: AdminRoleName): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Fire-and-forget is deliberate: an audit write must never block the action itself. */
export async function writeAudit(entry: {
  adminId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog
    .create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: (entry.metadata ?? {}) as object,
      },
    })
    .catch((err) => console.error("[audit] write failed", entry.action, err));
}
