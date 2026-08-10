import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  if (token) {
    try {
      await vendorWorkerFetch("/auth/logout", { method: "POST", sessionToken: token });
    } catch (err) {
      console.error("[vendor/logout]", err);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
