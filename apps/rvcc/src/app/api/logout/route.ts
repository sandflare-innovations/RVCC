import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  if (token) {
    try {
      const { clearVendorSessionCache } = await import("@/lib/session");
      clearVendorSessionCache(token);
      await vendorWorkerFetch("/auth/logout", { method: "POST", sessionToken: token });
    } catch (err) {
      console.error("[vendor/logout]", err);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(ENQUIRE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
