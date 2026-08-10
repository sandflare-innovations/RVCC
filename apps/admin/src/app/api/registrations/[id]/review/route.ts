import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

async function proxy(
  request: Request,
  path: string,
  method: string,
  body?: string
): Promise<NextResponse> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch(path, {
      method,
      sessionToken: token,
      body,
      headers: body ? { "Content-Type": "application/json" } : undefined,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error(`[admin BFF ${method} ${path}]`, err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await request.text();
  return proxy(request, `/registrations/${encodeURIComponent(id)}/review`, "POST", body);
}
