import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { Agent } from "@prisma/client";
import "server-only";

import { findAgentBySessionToken } from "@/lib/auth/agent-session";
import { AGENT_COOKIE } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export async function getAgentFromCookies(): Promise<Agent | null> {
  const jar = await cookies();
  const token = jar.get(AGENT_COOKIE)?.value;
  if (!token) return null;
  return findAgentBySessionToken(prisma, token);
}

export async function requireAgent(): Promise<Agent> {
  const agent = await getAgentFromCookies();
  if (!agent) redirect("/portal/login");
  return agent;
}
