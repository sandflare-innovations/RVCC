import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

/** This vendor's own notifications — proxied to the unified API. */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await vendorWorkerFetch("/notifications", {
      method: "GET",
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[vendor/notifications]", err);
    return NextResponse.json({ error: "Could not load notifications." }, { status: 503 });
  }
}

export async function POST() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await vendorWorkerFetch("/notifications", {
      method: "POST",
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[vendor/notifications]", err);
    return NextResponse.json({ error: "Could not update notifications." }, { status: 503 });
  }
}
