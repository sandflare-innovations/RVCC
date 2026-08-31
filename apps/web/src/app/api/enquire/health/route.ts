import { NextResponse } from "next/server";

import { apiConfigured, apiRoot } from "@/lib/api/root";

/** Quick check that Vercel can reach the unified API (use after deploy). */
export async function GET() {
  if (!apiConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "API_URL is not set on this deployment. Add it in Vercel → Settings → Environment Variables.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${apiRoot()}/health`, { cache: "no-store" });
    return NextResponse.json({
      ok: res.ok,
      apiReachable: res.status === 204 || res.ok,
      apiStatus: res.status,
    });
  } catch (err) {
    console.error("[enquire/health]", err);
    return NextResponse.json(
      { ok: false, error: "Could not reach the unified API. Check API_URL and redeploy apps/api." },
      { status: 503 }
    );
  }
}
