import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/requirements/[id]/live
 *
 * Proxy to the backend live-bids endpoint. Always returns JSON.
 * SSE streaming is NOT attempted — Next.js route handlers cannot reliably
 * proxy long-lived upstream SSE connections (causes "Failed to fetch").
 * The client polls this endpoint every 5 seconds instead.
 */
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const res = await adminWorkerFetch(`/requirements/${encodeURIComponent(params.id)}/live-bids`, {
      method: "GET",
      sessionToken: token,
      headers: { Accept: "application/json" },
    });

    const raw = await res.text();

    try {
      const data = JSON.parse(raw);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        {
          error: res.ok ? "Invalid data received from API" : `API returned HTTP ${res.status}`,
        },
        { status: res.ok ? 502 : res.status }
      );
    }
  } catch (err) {
    console.error("[admin live-bids proxy error]", err);
    return NextResponse.json({ error: "Live stream temporarily unavailable" }, { status: 503 });
  }
}
