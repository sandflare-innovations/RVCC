import { beforeEach, describe, expect, it } from "vitest";

import {
  createAgentSession,
  findAgentBySessionToken,
  revokeAgentSession,
} from "@/lib/auth/agent-session";
import { hashToken } from "@/lib/auth/token";
import { resetAgentTables, testPrisma } from "@/lib/test/db";

async function makeAgent(overrides: Record<string, unknown> = {}) {
  return testPrisma.agent.create({
    data: { email: "agent@example.com", name: "Agent", ...overrides },
  });
}

describe("agent sessions", () => {
  beforeEach(async () => {
    await resetAgentTables();
  });

  it("finds the agent from a fresh token", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    expect((await findAgentBySessionToken(testPrisma, token))?.id).toBe(agent.id);
  });

  it("stores the hash, never the raw token", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    const row = await testPrisma.agentSession.findFirst();
    expect(row?.tokenHash).toBe(await hashToken(token));
    expect(row?.tokenHash).not.toBe(token);
  });

  it("rejects an unknown token", async () => {
    expect(await findAgentBySessionToken(testPrisma, "made-up")).toBeNull();
  });

  it("rejects an empty token without querying", async () => {
    expect(await findAgentBySessionToken(testPrisma, "")).toBeNull();
  });

  it("rejects an expired session", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    await testPrisma.agentSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findAgentBySessionToken(testPrisma, token)).toBeNull();
  });

  it("rejects a session belonging to a deactivated agent", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    await testPrisma.agent.update({ where: { id: agent.id }, data: { isActive: false } });
    expect(await findAgentBySessionToken(testPrisma, token)).toBeNull();
  });

  it("stops working after revoke", async () => {
    const agent = await makeAgent();
    const token = await createAgentSession(testPrisma, agent.id);
    await revokeAgentSession(testPrisma, token);
    expect(await findAgentBySessionToken(testPrisma, token)).toBeNull();
  });

  it("revoking one agent's session leaves another's intact", async () => {
    const a = await makeAgent({ email: "a@example.com" });
    const b = await makeAgent({ email: "b@example.com" });
    const tokenA = await createAgentSession(testPrisma, a.id);
    const tokenB = await createAgentSession(testPrisma, b.id);
    await revokeAgentSession(testPrisma, tokenA);
    expect(await findAgentBySessionToken(testPrisma, tokenA)).toBeNull();
    expect((await findAgentBySessionToken(testPrisma, tokenB))?.id).toBe(b.id);
  });
});
