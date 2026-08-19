import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  VENDOR_COOKIE,
  VENDOR_PROFILE_COOKIE,
  expiredCookieOptions,
} from "@/lib/constants";
import { clearVendorSessionCache } from "@/lib/session";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE, "", expiredCookieOptions());
  res.cookies.set(VENDOR_PROFILE_COOKIE, "", expiredCookieOptions());

  if (token) {
    void clearVendorSessionCache(token);
    void vendorWorkerFetch("/auth/logout", { method: "POST", sessionToken: token }).catch(
      (err) => console.error("[vendor/logout] bg fail", err)
    );
  }

  return res;
}
