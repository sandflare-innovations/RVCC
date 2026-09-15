import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

  export async function GET(
    request: Request,
    ctx: { params: Promise<{ id: string; attachmentId: string }> }
  ) {
    const jar = await cookies();
    const token = jar.get(VENDOR_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { id, attachmentId } = await ctx.params;
    const download = new URL(request.url).searchParams.get("download") === "1" ? "?download=1" : "";
    try {
      const res = await vendorWorkerFetch(
        `/requirements/${encodeURIComponent(id)}/quote/attachment/${encodeURIComponent(attachmentId)}${download}`,
        { method: "GET", sessionToken: token }
      );
      const outType = res.headers.get("Content-Type") || "application/octet-stream";
      if (!outType.includes("application/json")) {
        return new Response(res.body, {
          status: res.status,
          headers: {
            "Content-Type": outType,
            "Content-Disposition": res.headers.get("Content-Disposition") || "inline",
            "Cache-Control": "private, no-store",
          },
        });
      }
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": outType } });
    } catch (err) {
      console.error("[vendor BFF quote attachment download]", err);
      return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
    }
  }

  export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id, attachmentId } = await ctx.params;
  try {
    const res = await vendorWorkerFetch(
      `/requirements/${encodeURIComponent(id)}/quote/attachment/${encodeURIComponent(attachmentId)}`,
      {
        method: "DELETE",
        sessionToken: token,
      }
    );
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[vendor BFF quote attachment delete]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
