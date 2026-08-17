import { NextResponse } from "next/server";

import {
  DOC_UNLOCK_COOKIE,
  clientIp,
  configuredDocPassword,
  docUnlockCookieOptions,
  mintUnlockToken,
  pinMatches,
  rateLimitUnlock,
} from "@/lib/document-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = configuredDocPassword();
  if (!secret) {
    return NextResponse.json({ error: "Document downloads are not configured." }, { status: 503 });
  }

  const ip = clientIp(request);
  if (!rateLimitUnlock(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!pinMatches(secret, code)) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(DOC_UNLOCK_COOKIE, mintUnlockToken(secret), docUnlockCookieOptions());
  return res;
}
