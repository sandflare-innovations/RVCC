import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAdminList } from "@/lib/admin-upstream";
import { ADMIN_COOKIE } from "@/lib/constants";

/** Always fetch the full registration list — client filters locally for instant tab switching. */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const result = await proxyAdminList("/registrations?status=ALL", token, "list registrations");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
