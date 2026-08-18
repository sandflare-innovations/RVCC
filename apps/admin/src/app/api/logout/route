import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;

  if (token) {
    try {
      const { clearAdminSessionCache } = await import("@/lib/session");
      clearAdminSessionCache(token);
      // Fire and forget with catch to prevent hanging
      adminWorkerFetch("/auth/logout", { method: "POST", sessionToken: token }).catch((err) =>
        console.error("[admin/logout] bg fail", err)
      );
    } catch (err) {
      console.error("[admin/logout]", err);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  return res;
}
