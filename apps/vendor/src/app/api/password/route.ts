import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const res = await vendorWorkerFetch("/auth/password", {
      method: "POST",
      sessionToken: token,
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Could not change your password." },
        { status: res.status }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vendor/password]", err);
    return NextResponse.json({ error: "Could not change your password." }, { status: 503 });
  }
}
