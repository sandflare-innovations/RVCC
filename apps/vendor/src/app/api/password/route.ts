import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE, VENDOR_PROFILE_COOKIE } from "@/lib/constants";
import { encodeVendorProfile, vendorProfileCookieOptions } from "@/lib/profile-cookie";
import { resolveVendorIdentity } from "@/lib/session";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const res = await vendorWorkerFetch("/auth/password", {
      method: "POST",
      sessionToken: token,
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "{}");
    let data: { ok?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {}
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Could not change your password." },
        { status: res.status }
      );
    }

    const out = NextResponse.json({ ok: true });
    const vendor = await resolveVendorIdentity(token);
    if (vendor) {
      out.cookies.set(
        VENDOR_PROFILE_COOKIE,
        encodeVendorProfile({ ...vendor, mustChangePassword: false }),
        vendorProfileCookieOptions()
      );
    }
    return out;
  } catch (err) {
    console.error("[vendor/password]", err);
    return NextResponse.json({ error: "Could not change your password." }, { status: 503 });
  }
}
