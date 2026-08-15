import type { Agent, PrismaClient } from "@prisma/client";

import { AGENT_SESSION_MS } from "@/lib/auth/constants";
import { hashToken, randomToken } from "@/lib/auth/token";

export async function createAgentSession(prisma: PrismaClient, agentId: string): Promise<string> {
  const token = randomToken();
  await prisma.agentSession.create({
    data: {
      agentId,
      tokenHash: await hashToken(token),
      expiresAt: new Date(Date.now() + AGENT_SESSION_MS),
    },
  });
  return token;
}

export async function findAgentBySessionToken(
  prisma: PrismaClient,
  token: string
): Promise<Agent | null> {
  if (!token) return null;
  const session = await prisma.agentSession.findUnique({
    where: { tokenHash: await hashToken(token) },
    include: { agent: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (!session.agent.isActive) return null;
  return session.agent;
}

export async function revokeAgentSession(prisma: PrismaClient, token: string): Promise<void> {
  if (!token) return;
  await prisma.agentSession.deleteMany({ where: { tokenHash: await hashToken(token) } });
}
