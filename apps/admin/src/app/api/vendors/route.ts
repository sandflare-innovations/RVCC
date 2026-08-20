import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

/** Always fetch the full vendor list — client filters locally for instant tab switching. */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/vendors?filter=ALL", {
      method: "GET",
      sessionToken: token,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !Array.isArray(data)) {
      console.error("[admin BFF list vendors] upstream", res.status, data);
      return NextResponse.json([], { status: res.ok ? 200 : 503 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin BFF list vendors]", err);
    return NextResponse.json([], { status: 503 });
  }
}

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/vendors", {
      method: "POST",
      sessionToken: token,
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF create vendor]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
