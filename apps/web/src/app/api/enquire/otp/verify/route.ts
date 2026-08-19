import { NextResponse } from "next/server";

import { enquireApiFetch } from "@/lib/api/enquire-api";
import { ENQUIRE_COOKIE, enquireCookieOptions } from "@/lib/enquire-constants";
import { otpVerifySchema } from "@/lib/enquire-schemas";
import { vendorPortalUrl } from "@/lib/public-urls";

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ENQUIRE_COOKIE, token, enquireCookieOptions());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and 6-digit code are required" }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const res = await enquireApiFetch("/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      outcome?: string;
      sessionToken?: string;
      currentStep?: string;
      message?: string;
      referenceNumber?: string | null;
      mustChangePassword?: boolean;
    };

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    if (data.outcome === "vendor") {
      return NextResponse.json({
        ok: true,
        outcome: "vendor",
        redirectUrl: vendorPortalUrl("/login"),
        mustChangePassword: Boolean(data.mustChangePassword),
        message: "Your supplier account is active. Sign in on the vendor portal to continue.",
      });
    }

    if (data.outcome === "held") {
      const out = NextResponse.json({
        ok: true,
        outcome: "held",
        message: data.message,
        referenceNumber: data.referenceNumber ?? null,
        status: (data as Record<string, unknown>).status ?? "SUBMITTED",
        registration: (data as Record<string, unknown>).registration ?? null,
      });
      if (data.sessionToken) setSessionCookie(out, data.sessionToken);
      return out;
    }

    if (data.outcome === "rejected") {
      return NextResponse.json({
        ok: true,
        outcome: data.outcome,
        message: data.message,
        referenceNumber: data.referenceNumber ?? null,
      });
    }

    const out = NextResponse.json({
      ok: true,
      outcome: data.outcome ?? "register",
      currentStep: data.currentStep ?? "company",
    });
    if (data.sessionToken) setSessionCookie(out, data.sessionToken);
    return out;
  } catch (err) {
    console.error("[enquire/otp/verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 503 });
  }
}
