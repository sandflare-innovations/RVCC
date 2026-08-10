import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_COOKIE } from "@/lib/admin/constants";
import { revokeAdminSession } from "@/lib/admin/session";

export async function POST() {
  const jar = await cookies();
  await revokeAdminSession(jar.get(ADMIN_COOKIE)?.value);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
