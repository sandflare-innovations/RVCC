import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminBaseUrl } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const formData = await request.formData();
    const targetUrl = `${adminBaseUrl()}/content/upload`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "X-Admin-Session": token,
        "User-Agent": "RVCC-Admin-SSR/1.0",
      },
      body: formData,
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF POST content/upload]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
