import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const isSse = request.headers.get("Accept")?.includes("text/event-stream");
    const res = await vendorWorkerFetch(`/requirements/${encodeURIComponent(id)}/live-bids`, {
      method: "GET",
      sessionToken: token,
      headers: {
        Accept: isSse ? "text/event-stream" : "application/json",
      },
    });

    if (isSse && res.ok && res.body) {
      return new Response(res.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[vendor live-bids proxy error]", err);
    return NextResponse.json({ error: "Live stream unavailable" }, { status: 503 });
  }
}
