import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { revokeAdminSession } from "@/lib/auth/admin-session";
import { ADMIN_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) {
    await revokeAdminSession(prisma, token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
