import type { Agent, PrismaClient } from "@prisma/client";

import { OTP_MAX_ATTEMPTS, OTP_MAX_PER_HOUR, OTP_TTL_MS } from "@/lib/auth/constants";
import { hashToken } from "@/lib/auth/token";

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

/** Six digits, uniformly distributed, from a CSPRNG. */
function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function issueAgentOtp(
  prisma: PrismaClient,
  email: string
): Promise<{ issued: boolean; code?: string }> {
  const normalized = normalize(email);

  const agent = await prisma.agent.findUnique({ where: { email: normalized } });
  if (!agent || !agent.isActive) return { issued: false };

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.agentOtp.count({
    where: { email: normalized, createdAt: { gt: since } },
  });
  if (recent >= OTP_MAX_PER_HOUR) return { issued: false };

  const code = generateCode();
  await prisma.agentOtp.create({
    data: {
      email: normalized,
      codeHash: await hashToken(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { issued: true, code };
}

export async function verifyAgentOtp(
  prisma: PrismaClient,
  email: string,
  code: string
): Promise<{ ok: true; agent: Agent } | { ok: false }> {
  const normalized = normalize(email);
  if (!/^\d{6}$/.test(code)) return { ok: false };

  const otp = await prisma.agentOtp.findFirst({
    where: { email: normalized, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false };
  if (otp.expiresAt.getTime() <= Date.now()) return { ok: false };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false };

  if (otp.codeHash !== (await hashToken(code))) {
    await prisma.agentOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false };
  }

  const agent = await prisma.agent.findUnique({ where: { email: normalized } });
  if (!agent || !agent.isActive) return { ok: false };

  await prisma.agentOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return { ok: true, agent };
}
