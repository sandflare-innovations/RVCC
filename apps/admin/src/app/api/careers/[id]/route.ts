import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

async function forward(
  method: string,
  id: string,
  token: string,
  body?: string
): Promise<NextResponse> {
  try {
    const res = await adminWorkerFetch(`/careers/${encodeURIComponent(id)}`, {
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
    console.error(`[admin BFF ${method} career]`, err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  return forward("PATCH", id, token, await request.text());
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  return forward("DELETE", id, token);
}
