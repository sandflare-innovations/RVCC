import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PROCUREMENT_COOKIE, PROCUREMENT_PROFILE_COOKIE } from "@/lib/constants";
import { encodeProcurementProfile, procurementProfileCookieOptions } from "@/lib/profile-cookie";
import { resolveProcurementIdentity } from "@/lib/session";

/**
 * GET /api/me
 * Returns current logged-in user profile from session and refreshes client profile cookie.
 */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(PROCUREMENT_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await resolveProcurementIdentity(token);
  if (!user) {
    return NextResponse.json({ error: "Session invalid or expired" }, { status: 401 });
  }

  const res = NextResponse.json({ user });
  res.cookies.set(
    PROCUREMENT_PROFILE_COOKIE,
    encodeProcurementProfile(user),
    procurementProfileCookieOptions()
  );

  return res;
}
