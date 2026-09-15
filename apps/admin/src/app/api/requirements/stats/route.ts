import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAdminGet } from "@/lib/admin-upstream";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const result = await proxyAdminGet("/requirements/stats", token, "requirement stats");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
