import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/admin/constants";
import { revokeVendorSession } from "@/lib/vendor/session";

export async function POST() {
  const jar = await cookies();
  await revokeVendorSession(jar.get(VENDOR_COOKIE)?.value);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
