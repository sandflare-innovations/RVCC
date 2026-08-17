import { NextResponse } from "next/server";

import { enquireApiFetch } from "@/lib/api/enquire-api";
import { otpRequestSchema } from "@/lib/enquire-schemas";

/** Allow slow SMTP round-trips on serverless hosts. */
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const res = await enquireApiFetch("/otp/request", {
      method: "POST",
      body: JSON.stringify({ email: parsed.data.email }),
    });

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      return NextResponse.json(
        { error: `Mail service returned ${res.status}` },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      message: "Access code sent. Check your email.",
    });
  } catch (err) {
    console.error("[enquire/otp/request]", err);
    return NextResponse.json({ error: "Unable to send access code." }, { status: 503 });
  }
}
