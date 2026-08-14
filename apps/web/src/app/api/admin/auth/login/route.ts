import { NextResponse } from "next/server";

import { z } from "zod";

import { attemptAdminLogin } from "@/lib/auth/admin-login";
import { createAdminSession } from "@/lib/auth/admin-session";
import { ADMIN_COOKIE, ADMIN_SESSION_MS } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GENERIC = "Email or password is incorrect.";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await attemptAdminLogin(prisma, parsed.data.email, parsed.data.password);

  if (!result.ok) {
    if (result.reason === "locked") {
      return NextResponse.json(
        { error: "Too many failed attempts. Try again in 15 minutes." },
        { status: 423 }
      );
    }
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const token = await createAdminSession(prisma, result.admin.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MS / 1000,
  });
  return response;
}
