import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  if (token) {
    try {
      const { clearVendorSessionCache } = await import("@/lib/session");
      clearVendorSessionCache(token);
      // Fire and forget
      vendorWorkerFetch("/auth/logout", { method: "POST", sessionToken: token }).catch((err) =>
        console.error("[vendor/logout] bg fail", err)
      );
    } catch (err) {
      console.error("[vendor/logout]", err);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE, "", { path: "/", maxAge: 0, expires: new Date(0) });
  return res;
}
