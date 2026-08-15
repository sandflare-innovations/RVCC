import { NextResponse, after } from "next/server";

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
    const email = parsed.data.email;
    const code = result.code;
    // Sent after the response goes out: the caller learns nothing from the
    // send outcome either way, and awaiting the Worker round-trip here would
    // leak account existence through response latency.
    after(async () => {
      const mail = await sendAgentOtpEmail(email, code);
      if (!mail.sent) {
        // Log for operators; the caller already got the generic message so a
        // mail outage does not become an account-existence oracle.
        console.error("[portal/request-code] mail failed:", mail.error);
      }
    });
  }

  return NextResponse.json({ message: GENERIC });
}
