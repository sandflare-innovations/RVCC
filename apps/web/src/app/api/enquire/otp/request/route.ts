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
      const hint =
        res.status === 404
          ? "Enquire API route not found. Set API_URL to https://rvcc-api.rvcc.workers.dev (no /enquire suffix) and redeploy apps/api."
          : undefined;
      return NextResponse.json({ ...data, hint }, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      message: "Access code sent. Check your email.",
    });
  } catch (err) {
    console.error("[enquire/otp/request]", err);
    const message =
      err instanceof Error && err.message.includes("API_URL")
        ? err.message
        : "Unable to send access code. Check API_URL on Vercel.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
