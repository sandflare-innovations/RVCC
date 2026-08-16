import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!workerConfigured()) {
      return NextResponse.json({ error: "API not configured" }, { status: 503 });
    }
    const jar = await cookies();
    const token = jar.get(ENQUIRE_COOKIE)?.value ?? null;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated — verify your email again." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const res = await enquireWorkerFetch("/submit", {
      method: "POST",
      body,
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[enquire/submit]", err);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
