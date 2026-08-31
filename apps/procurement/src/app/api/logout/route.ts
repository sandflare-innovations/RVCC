import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  expiredCookieOptions,
  PROCUREMENT_COOKIE,
  PROCUREMENT_PROFILE_COOKIE,
} from "@/lib/constants";
import { procurementApiFetch } from "@/lib/procurement-api";
import { clearProcurementSessionCache } from "@/lib/session";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(PROCUREMENT_COOKIE)?.value;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PROCUREMENT_COOKIE, "", expiredCookieOptions());
  res.cookies.set(PROCUREMENT_PROFILE_COOKIE, "", expiredCookieOptions());

  if (token) {
    clearProcurementSessionCache(token);
    void procurementApiFetch("/auth/logout", {
      method: "POST",
      sessionToken: token,
    }).catch((err) => console.error("[procurement/logout] error", err));
  }

  return res;
}
