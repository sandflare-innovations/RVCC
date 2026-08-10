import { NextResponse } from "next/server";

import { z } from "zod";

import { VENDOR_COOKIE } from "@/lib/admin/constants";
import { attemptVendorLogin } from "@/lib/vendor/auth";
import { createVendorSession, vendorCookieOptions } from "@/lib/vendor/session";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

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

  const result = await attemptVendorLogin(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    if (result.reason === "locked") {
      const mins = Math.ceil((result.retryAfterMs ?? 0) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429 }
      );
    }
    if (result.reason === "disabled") {
      return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
    }
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = await createVendorSession(result.vendorId, request.headers.get("user-agent") ?? "");
  const res = NextResponse.json({ ok: true, mustChangePassword: result.mustChangePassword });
  res.cookies.set(VENDOR_COOKIE, token, vendorCookieOptions());
  return res;
}
