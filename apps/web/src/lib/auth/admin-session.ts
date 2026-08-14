import type { AdminUser, PrismaClient } from "@prisma/client";

import { ADMIN_SESSION_MS } from "@/lib/auth/constants";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

export async function createAdminSession(
  prisma: PrismaClient,
  adminUserId: string
): Promise<string> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash: await hashToken(token),
      expiresAt: new Date(Date.now() + ADMIN_SESSION_MS),
    },
  });
  return token;
}

export async function findAdminBySessionToken(
  prisma: PrismaClient,
  token: string
): Promise<AdminUser | null> {
  if (!token) return null;
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: await hashToken(token) },
    include: { adminUser: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (!session.adminUser.isActive) return null;
  return session.adminUser;
}

export async function revokeAdminSession(prisma: PrismaClient, token: string): Promise<void> {
  if (!token) return;
  await prisma.adminSession.deleteMany({ where: { tokenHash: await hashToken(token) } });
}
