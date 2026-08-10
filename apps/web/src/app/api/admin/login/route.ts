import { NextResponse } from "next/server";

import { z } from "zod";

import { attemptAdminLogin } from "@/lib/admin/auth";
import { ADMIN_COOKIE } from "@/lib/admin/constants";
import { adminCookieOptions, createAdminSession, writeAudit } from "@/lib/admin/session";
import { apiError } from "@/lib/api/errors";

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

  /*
   * Everything touching the database is wrapped: an unhandled throw would
   * become an HTML error page, and the client's JSON parse would fail, making
   * a database outage look exactly like a wrong password.
   */
  try {
    const result = await attemptAdminLogin(parsed.data.email, parsed.data.password);

    if (!result.ok) {
      if (result.reason === "locked") {
        const mins = Math.ceil((result.retryAfterMs ?? 0) / 60000);
        return NextResponse.json(
          {
            error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
          },
          { status: 429 }
        );
      }
      if (result.reason === "disabled") {
        return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
      }
      // Deliberately identical for unknown email and wrong password.
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const token = await createAdminSession(result.adminId, request.headers.get("user-agent") ?? "");
    await writeAudit({
      adminId: result.adminId,
      action: "admin.login",
      entityType: "AdminUser",
      entityId: result.adminId,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions());
    return res;
  } catch (err) {
    return apiError(err, "Could not sign in.");
  }
}
