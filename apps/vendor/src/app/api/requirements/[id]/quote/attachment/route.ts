import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export const maxDuration = 60;

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  try {
    // Forward the raw multipart body + boundary. Re-parsing into FormData can drop
    // filename/MIME and breaks upload on some Node/undici ↔ Worker combinations.
    const res = await vendorWorkerFetch(`/requirements/${encodeURIComponent(id)}/quote/attachment`, {
      method: "POST",
      sessionToken: token,
      body: await request.arrayBuffer(),
      headers: { "Content-Type": contentType },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[vendor BFF quote attachment upload]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
