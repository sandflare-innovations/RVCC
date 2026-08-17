import { NextResponse } from "next/server";

import { otpRequestSchema } from "@/lib/enquire-schemas";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!workerConfigured()) {
      return NextResponse.json(
        { error: "Configure API_URL for the supplier portal." },
        { status: 503 }
      );
    }
    const res = await enquireWorkerFetch("/otp/request", {
      method: "POST",
      body: { email: parsed.data.email },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json({
      ok: true,
      message: "Access code sent. Check your email.",
    });
  } catch (err) {
    console.error("[enquire/otp/request]", err);
    return NextResponse.json({ error: "Unable to send access code." }, { status: 500 });
  }
}
