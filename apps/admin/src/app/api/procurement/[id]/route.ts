import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminApiFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminApiFetch(`/procurement/${encodeURIComponent(id)}`, {
      method: "GET",
      sessionToken: token,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(`[admin BFF GET /procurement/${id}]`, err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminApiFetch(`/procurement/${encodeURIComponent(id)}`, {
      method: "DELETE",
      sessionToken: token,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(`[admin BFF DELETE /procurement/${id}]`, err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}
