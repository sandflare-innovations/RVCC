import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { page } = await params;
  const body = await request.text();

  try {
    const res = await adminWorkerFetch(`/hero-slides/page/${encodeURIComponent(page)}`, {
      method: "PUT",
      sessionToken: token,
      body,
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error(`[admin BFF PUT hero-slides/page/${page}]`, err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
