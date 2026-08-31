import { NextResponse } from "next/server";
import { z } from "zod";

import { VENDOR_COOKIE, VENDOR_PROFILE_COOKIE, vendorCookieOptions } from "@/lib/constants";
import { encodeVendorProfile, vendorProfileCookieOptions } from "@/lib/profile-cookie";
import { resolveVendorIdentity } from "@/lib/session";
import { vendorWorkerFetch } from "@/lib/vendor-api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const res = await vendorWorkerFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { "User-Agent": request.headers.get("user-agent") ?? "" },
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Incorrect email or password." },
        { status: res.status }
      );
    }

    const out = NextResponse.json({
      ok: true,
      mustChangePassword: Boolean(data.mustChangePassword),
    });
    out.cookies.set(VENDOR_COOKIE, data.token, vendorCookieOptions());

    const vendor = data.vendor || (await resolveVendorIdentity(data.token));
    if (vendor) {
      out.cookies.set(
        VENDOR_PROFILE_COOKIE,
        encodeVendorProfile(vendor),
        vendorProfileCookieOptions()
      );
    }

    return out;
  } catch (err: any) {
    console.error("[vendor/login]", err);
    return NextResponse.json(
      {
        error: "Could not sign in.",
        message: String(err?.message || err),
        stack: String(err?.stack || ""),
      },
      { status: 503 }
    );
  }
}
