import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

/** This admin's own notifications — proxied to the unified API. */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/notifications", {
      method: "GET",
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[admin/notifications]", err);
    return NextResponse.json({ error: "Could not load notifications." }, { status: 503 });
  }
}

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/notifications", {
      method: "POST",
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[admin/notifications]", err);
    return NextResponse.json({ error: "Could not update notifications." }, { status: 503 });
  }
}
