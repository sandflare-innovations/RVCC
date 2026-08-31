import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ENQUIRE_COOKIE, enquireCookieOptions } from "@/lib/enquire-constants";
import { draftPatchSchema } from "@/lib/enquire-schemas";
import { enquireWorkerFetch } from "@/lib/enquire-worker";

async function withRenewedSessionCookie(body: unknown, status = 200) {
  const out = NextResponse.json(body, { status });
  const jar = await cookies();
  const token = jar.get(ENQUIRE_COOKIE)?.value;
  if (token) out.cookies.set(ENQUIRE_COOKIE, token, enquireCookieOptions());
  return out;
}

export async function GET() {
  try {
    const res = await enquireWorkerFetch("/draft", { method: "GET" });
    if (res.status === 401) {
      return NextResponse.json({ registration: null });
    }
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return withRenewedSessionCookie(data, res.status);
  } catch (err) {
    console.error("[enquire/draft GET]", err);
    return NextResponse.json({ error: "Failed to load draft" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = draftPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const res = await enquireWorkerFetch("/draft", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return withRenewedSessionCookie(data, res.status);
  } catch (err) {
    console.error("[enquire/draft PATCH]", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 503 });
  }
}
