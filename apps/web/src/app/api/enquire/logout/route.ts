import { NextResponse } from "next/server";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

/** Clears the enquire browser session so the user can verify a different email. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ENQUIRE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
