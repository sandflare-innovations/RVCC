import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { procurementApiFetch } from "@/lib/procurement-api";
import { PROCUREMENT_COOKIE } from "@/lib/constants";

/** GET list of purchase requests from backend API for procurement portal */
export async function GET(request: Request) {
  const jar = await cookies();
  const token = jar.get(PROCUREMENT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "ALL";

  try {
    const res = await procurementApiFetch(`/procurement?status=${encodeURIComponent(status)}`, {
      method: "GET",
      sessionToken: token,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[procurement BFF GET /api/procurement]", err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}

/** POST create a new purchase request from procurement portal */
export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(PROCUREMENT_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const body = await request.text();
    const res = await procurementApiFetch("/procurement", {
      method: "POST",
      sessionToken: token,
      body,
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[procurement BFF POST /api/procurement]", err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}
