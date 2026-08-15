import { NextResponse } from "next/server";

import { z } from "zod";

import { verifyAgentOtp } from "@/lib/auth/agent-otp";
import { createAgentSession } from "@/lib/auth/agent-session";
import { AGENT_COOKIE, AGENT_SESSION_MS } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

const GENERIC = "That code is invalid or has expired. Request a new one.";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await verifyAgentOtp(prisma, parsed.data.email, parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const token = await createAgentSession(prisma, result.agent.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AGENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: AGENT_SESSION_MS / 1000,
  });
  return response;
}
