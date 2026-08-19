import { NextResponse } from "next/server";

import { z } from "zod";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE, ADMIN_PROFILE_COOKIE, adminCookieOptions } from "@/lib/constants";
import { adminProfileCookieOptions, encodeAdminProfile } from "@/lib/profile-cookie";
import { resolveAdminIdentity } from "@/lib/session";

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
    const res = await adminWorkerFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { "User-Agent": request.headers.get("user-agent") ?? "" },
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      token?: string;
      error?: string;
    };

    if (!res.ok || !data.token) {
      return NextResponse.json(
        { error: data.error || "Incorrect email or password." },
        { status: res.status }
      );
    }

    const out = NextResponse.json({ ok: true });
    out.cookies.set(ADMIN_COOKIE, data.token, adminCookieOptions());

    const admin = await resolveAdminIdentity(data.token);
    if (admin) {
      out.cookies.set(
        ADMIN_PROFILE_COOKIE,
        encodeAdminProfile(admin),
        adminProfileCookieOptions()
      );
    }

    return out;
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ error: "Could not sign in." }, { status: 503 });
  }
}
