import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminApiFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const res = await adminApiFetch("/staff/otp/request", {
      method: "POST",
      sessionToken: token,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[admin BFF POST /api/staff/otp]", err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}
