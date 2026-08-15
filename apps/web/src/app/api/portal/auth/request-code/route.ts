import { NextResponse } from "next/server";

import { z } from "zod";

import { issueAgentOtp } from "@/lib/auth/agent-otp";
import { prisma } from "@/lib/db";
import { sendAgentOtpEmail } from "@/lib/mail-client";

const schema = z.object({ email: z.string().email() });

/** Identical for every outcome, so nobody can probe which emails are registered. */
const GENERIC = "If your email is registered, a code is on the way.";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const result = await issueAgentOtp(prisma, parsed.data.email);

  if (result.issued && result.code) {
    const mail = await sendAgentOtpEmail(parsed.data.email, result.code);
    if (!mail.sent) {
      // Log for operators; the caller still gets the generic message so a mail
      // outage does not become an account-existence oracle.
      console.error("[portal/request-code] mail failed:", mail.error);
    }
  }

  return NextResponse.json({ message: GENERIC });
}
