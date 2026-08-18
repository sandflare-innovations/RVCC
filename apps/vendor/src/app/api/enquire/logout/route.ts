import { NextResponse } from "next/server";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

/** Clears the email-gate cookie. Browser draft cache is cleared by the client. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ENQUIRE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
