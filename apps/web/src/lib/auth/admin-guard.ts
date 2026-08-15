import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AdminUser } from "@prisma/client";
import "server-only";

import { findAdminBySessionToken } from "@/lib/auth/admin-session";
import { ADMIN_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function getAdminFromCookies(): Promise<AdminUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return findAdminBySessionToken(prisma, token);
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminFromCookies();
  if (!admin) redirect("/admin/login");
  return admin;
}
