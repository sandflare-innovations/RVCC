import { NextResponse } from "next/server";

import { VENDOR_COOKIE, vendorCookieOptions } from "@/lib/constants";
import { ENQUIRE_COOKIE, enquireCookieOptions } from "@/lib/enquire-constants";
import { otpVerifySchema } from "@/lib/enquire-schemas";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and 6-digit code are required" }, { status: 400 });
    }
    if (!workerConfigured()) {
      return NextResponse.json(
        { error: "Configure API_URL for the supplier portal." },
        { status: 503 }
      );
    }

    const res = await enquireWorkerFetch("/otp/verify", {
      method: "POST",
      body: parsed.data,
      sessionToken: null,
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      outcome?: string;
      message?: string;
      sessionToken?: string;
      vendorToken?: string;
      mustChangePassword?: boolean;
      referenceNumber?: string | null;
    };

    if (!res.ok) return NextResponse.json(data, { status: res.status });

    const payload: Record<string, unknown> = {
      ok: true,
      outcome: data.outcome,
      message: data.message,
      mustChangePassword: data.mustChangePassword,
      referenceNumber: data.referenceNumber,
    };

    if (data.outcome === "held") {
      const raw = data as Record<string, unknown>;
      payload.status = raw.status ?? "SUBMITTED";
      payload.registration = raw.registration ?? null;
    }

    const out = NextResponse.json(payload);

    if (data.outcome === "vendor" && data.vendorToken) {
      out.cookies.set(VENDOR_COOKIE, data.vendorToken, vendorCookieOptions());
      out.cookies.set(ENQUIRE_COOKIE, "", { path: "/", maxAge: 0 });
    } else if ((data.outcome === "register" || data.outcome === "held") && data.sessionToken) {
      out.cookies.set(ENQUIRE_COOKIE, data.sessionToken, enquireCookieOptions());
    } else {
      out.cookies.set(ENQUIRE_COOKIE, "", { path: "/", maxAge: 0 });
    }

    return out;
  } catch (err) {
    console.error("[enquire/otp/verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
