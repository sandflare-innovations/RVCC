import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminApiFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await adminApiFetch(`/staff/${encodeURIComponent(id)}/password`, {
      method: "POST",
      sessionToken: token,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(`[admin BFF POST /api/staff/${id}/password]`, err);
    return NextResponse.json({ error: "Upstream service unavailable" }, { status: 503 });
  }
}
