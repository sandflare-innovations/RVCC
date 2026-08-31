import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { enquireApiFetch } from "@/lib/api/enquire-api";
import { ENQUIRE_COOKIE, enquireCookieOptions } from "@/lib/enquire-constants";

async function withRenewedSessionCookie(body: unknown, status = 200) {
  const out = NextResponse.json(body, { status });
  const jar = await cookies();
  const token = jar.get(ENQUIRE_COOKIE)?.value;
  if (token) out.cookies.set(ENQUIRE_COOKIE, token, enquireCookieOptions());
  return out;
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const jar = await cookies();
    const token = jar.get(ENQUIRE_COOKIE)?.value ?? null;
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated — verify your email again." },
        { status: 401 }
      );
    }

    const res = await enquireApiFetch(`/attachments/${encodeURIComponent(id)}`, {
      method: "DELETE",
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return withRenewedSessionCookie(data, res.status);
  } catch (err) {
    console.error("[enquire/attachments DELETE]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 503 });
  }
}
