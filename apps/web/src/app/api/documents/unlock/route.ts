import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { z } from "zod";

const schema = z.object({
  pin: z.string().length(4),
});

export async function POST(request: Request) {
  const expected = process.env.DOC_PASSWORD?.trim();
  if (!expected) {
    console.error("[documents/unlock] DOC_PASSWORD is not configured");
    return NextResponse.json({ error: "Download protection is not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 4-digit code." }, { status: 400 });
  }

  const entered = Buffer.from(parsed.data.pin);
  const secret = Buffer.from(expected);
  if (entered.length !== secret.length || !timingSafeEqual(entered, secret)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
