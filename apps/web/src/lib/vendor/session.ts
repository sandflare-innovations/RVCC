import { cookies } from "next/headers";

import { createHash, randomBytes } from "node:crypto";
import "server-only";

import { VENDOR_COOKIE, VENDOR_SESSION_TTL_MS } from "@/lib/admin/constants";
import { prisma } from "@/lib/db";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVendorSession(vendorId: string, userAgent = "") {
  const token = randomBytes(32).toString("hex");
  await prisma.vendorSession.create({
    data: {
      tokenHash: hashToken(token),
      vendorId,
      userAgent: userAgent.slice(0, 255),
      expiresAt: new Date(Date.now() + VENDOR_SESSION_TTL_MS),
    },
  });
  return token;
}

export function vendorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(VENDOR_SESSION_TTL_MS / 1000),
  };
}

export type VendorIdentity = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  registrationId: string;
};

/**
 * Authoritative vendor session check.
 *
 * A vendor session grants access to /vendor only. It is a separate cookie,
 * table and code path from the admin session — there is deliberately no way for
 * one to be mistaken for the other.
 */
export async function getVendorFromSession(): Promise<VendorIdentity | null> {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.vendorSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { vendor: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (!session.vendor.isActive) return null;

  return {
    id: session.vendor.id,
    email: session.vendor.email,
    name: session.vendor.name,
    mustChangePassword: session.vendor.mustChangePassword,
    registrationId: session.vendor.registrationId,
  };
}

export async function revokeVendorSession(token: string | undefined) {
  if (!token) return;
  await prisma.vendorSession
    .update({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } })
    .catch(() => {
      /* already gone */
    });
}

/** Used after a password change so other devices are signed out. */
export async function revokeAllVendorSessions(vendorId: string, exceptToken?: string) {
  await prisma.vendorSession.updateMany({
    where: {
      vendorId,
      revokedAt: null,
      ...(exceptToken ? { NOT: { tokenHash: hashToken(exceptToken) } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}
