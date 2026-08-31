import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminApiFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const body = await request.text();
    const res = await adminApiFetch(`/procurement/${encodeURIComponent(id)}/review`, {
      method: "POST",
      sessionToken: token,
      body,
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(`[admin BFF POST /procurement/${id}/review]`, err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}
