import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const isSse = request.headers.get("Accept")?.includes("text/event-stream");
    const res = await adminWorkerFetch(`/requirements/${encodeURIComponent(params.id)}/live-bids`, {
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
    console.error("[admin live-bids proxy error]", err);
    return NextResponse.json({ error: "Live stream unavailable" }, { status: 503 });
  }
}
