import { NextResponse } from "next/server";
import { z } from "zod";

import {
  PROCUREMENT_COOKIE,
  PROCUREMENT_PROFILE_COOKIE,
  procurementCookieOptions,
} from "@/lib/constants";
import { procurementApiFetch } from "@/lib/procurement-api";
import { encodeProcurementProfile, procurementProfileCookieOptions } from "@/lib/profile-cookie";
import { resolveProcurementIdentity } from "@/lib/session";

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
    const res = await procurementApiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { "User-Agent": request.headers.get("user-agent") ?? "" },
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      token?: string;
      admin?: { id: string; email: string; name: string; role: string };
      error?: string;
    };

    if (!res.ok || !data.token) {
      return NextResponse.json(
        { error: data.error || "Incorrect email or password." },
        { status: res.status || 401 }
      );
    }

    const out = NextResponse.json({ ok: true });
    out.cookies.set(PROCUREMENT_COOKIE, data.token, procurementCookieOptions());

    const user = data.admin || (await resolveProcurementIdentity(data.token));
    if (user) {
      out.cookies.set(
        PROCUREMENT_PROFILE_COOKIE,
        encodeProcurementProfile(user),
        procurementProfileCookieOptions()
      );
    }

    return out;
  } catch (err) {
    console.error("[procurement/login] network failure", err);
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 });
  }
}
