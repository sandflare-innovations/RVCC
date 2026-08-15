import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { revokeAgentSession } from "@/lib/auth/agent-session";
import { AGENT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(AGENT_COOKIE)?.value;
  if (token) {
    await revokeAgentSession(prisma, token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AGENT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
