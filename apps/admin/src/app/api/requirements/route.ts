import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAdminList } from "@/lib/admin-upstream";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const result = await proxyAdminList("/requirements", token, "list requirements");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const { adminWorkerFetch } = await import("@/lib/admin-api");
    const res = await adminWorkerFetch("/requirements", {
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
    console.error("[admin BFF create requirement]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
