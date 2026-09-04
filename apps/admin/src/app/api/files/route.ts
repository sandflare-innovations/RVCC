import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const path = `/files${qs ? `?${qs}` : ""}`;

  try {
    const res = await adminWorkerFetch(path, {
      method: "GET",
      sessionToken: token,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF GET files]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
