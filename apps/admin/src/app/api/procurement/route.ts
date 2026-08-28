import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminApiFetch } from "@/lib/admin-api";
import { proxyAdminList } from "@/lib/admin-upstream";
import { ADMIN_COOKIE } from "@/lib/constants";

/** GET list of purchase requests from backend API */
export async function GET(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "ALL";

  const result = await proxyAdminList(`/procurement?status=${encodeURIComponent(status)}`, token, "list procurement requisitions");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}

/** POST create a new purchase request */
export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const body = await request.text();
    const res = await adminApiFetch("/procurement", {
      method: "POST",
      sessionToken: token,
      body,
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[admin BFF POST /procurement]", err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}
