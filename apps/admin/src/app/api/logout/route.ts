import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import {
  ADMIN_COOKIE,
  ADMIN_PROFILE_COOKIE,
  expiredCookieOptions,
} from "@/lib/constants";
import { clearAdminSessionCache } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;

  // Clear cookies first — client may already have navigated away.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", expiredCookieOptions());
  res.cookies.set(ADMIN_PROFILE_COOKIE, "", expiredCookieOptions());

  if (token) {
    void clearAdminSessionCache(token);
    void adminWorkerFetch("/auth/logout", { method: "POST", sessionToken: token }).catch(
      (err) => console.error("[admin/logout] bg fail", err)
    );
  }

  return res;
}
