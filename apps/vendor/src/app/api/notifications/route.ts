import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorApiFetch } from "@/lib/vendor-api";

/** This vendor's own notifications — proxied to the unified API. */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await vendorApiFetch("/notifications", {
      method: "GET",
      sessionToken: token,
    });
    const text = await res.text().catch(() => "{}");
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Ignored
    }
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
    const res = await vendorApiFetch("/notifications", {
      method: "POST",
      sessionToken: token,
    });
    const text = await res.text().catch(() => "{}");
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Ignored
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[vendor/notifications]", err);
    return NextResponse.json({ error: "Could not update notifications." }, { status: 503 });
  }
}
