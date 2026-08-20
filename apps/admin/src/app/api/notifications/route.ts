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
    if (!res.ok) {
      console.error("[admin/notifications] upstream", res.status, data);
      return NextResponse.json({ items: [], unread: 0 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/notifications]", err);
    return NextResponse.json({ items: [], unread: 0 });
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
    if (!res.ok) {
      console.error("[admin/notifications] mark-read upstream", res.status);
      return NextResponse.json({ ok: true });
    }
    const data = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/notifications]", err);
    return NextResponse.json({ ok: true });
  }
}
