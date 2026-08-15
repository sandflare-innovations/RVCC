import { beforeEach, describe, expect, it } from "vitest";

import { issueAgentOtp, verifyAgentOtp } from "@/lib/auth/agent-otp";
import { OTP_MAX_ATTEMPTS, OTP_MAX_PER_HOUR } from "@/lib/auth/constants";
import { resetAgentTables, testPrisma } from "@/lib/test/db";

const EMAIL = "agent@example.com";

async function makeAgent(overrides: Record<string, unknown> = {}) {
  return testPrisma.agent.create({ data: { email: EMAIL, name: "Agent", ...overrides } });
}

describe("agent one-time codes", () => {
  beforeEach(async () => {
    await resetAgentTables();
  });

  it("issues a 6-digit code to a known active agent", async () => {
    await makeAgent();
    const result = await issueAgentOtp(testPrisma, EMAIL);
    expect(result.issued).toBe(true);
    expect(result.code).toMatch(/^\d{6}$/);
  });

  it("does not issue to an unknown email", async () => {
    expect((await issueAgentOtp(testPrisma, "nobody@example.com")).issued).toBe(false);
  });

  it("does not issue to a deactivated agent", async () => {
    await makeAgent({ isActive: false });
    expect((await issueAgentOtp(testPrisma, EMAIL)).issued).toBe(false);
  });

  it("never writes the raw code to the database", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    const row = await testPrisma.agentOtp.findFirst();
    expect(row?.codeHash).not.toBe(code);
  });

  it("is case-insensitive on email", async () => {
    await makeAgent();
    expect((await issueAgentOtp(testPrisma, "AGENT@EXAMPLE.COM")).issued).toBe(true);
  });

  it("stops issuing after the hourly limit", async () => {
    await makeAgent();
    for (let i = 0; i < OTP_MAX_PER_HOUR; i++) {
      expect((await issueAgentOtp(testPrisma, EMAIL)).issued).toBe(true);
    }
    expect((await issueAgentOtp(testPrisma, EMAIL)).issued).toBe(false);
  });

  it("verifies a correct code and returns the agent", async () => {
    const agent = await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    const result = await verifyAgentOtp(testPrisma, EMAIL, code!);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.agent.id).toBe(agent.id);
  });

  it("rejects a wrong code", async () => {
    await makeAgent();
    await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, "000000")).ok).toBe(false);
  });

  it("consumes the code so it cannot be reused", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(true);
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);
  });

  it("rejects an expired code", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    await testPrisma.agentOtp.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);
  });

  it("kills the code after too many wrong guesses, even if the right one follows", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      expect((await verifyAgentOtp(testPrisma, EMAIL, "000000")).ok).toBe(false);
    }
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);
  });

  it("only accepts the newest code when several were issued", async () => {
    await makeAgent();
    const first = await issueAgentOtp(testPrisma, EMAIL);
    const second = await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, first.code!)).ok).toBe(false);
    expect((await verifyAgentOtp(testPrisma, EMAIL, second.code!)).ok).toBe(true);
  });

  it("cannot resurrect a superseded code after the newer one is consumed", async () => {
    await makeAgent();
    const first = await issueAgentOtp(testPrisma, EMAIL);
    const second = await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, second.code!)).ok).toBe(true);
    expect((await verifyAgentOtp(testPrisma, EMAIL, first.code!)).ok).toBe(false);
  });

  it("rejects a superseded code immediately, without touching the newer one", async () => {
    await makeAgent();
    const first = await issueAgentOtp(testPrisma, EMAIL);
    await issueAgentOtp(testPrisma, EMAIL);
    expect((await verifyAgentOtp(testPrisma, EMAIL, first.code!)).ok).toBe(false);
  });

  it("still lets a legitimate user in after a few wrong guesses", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    for (let i = 0; i < OTP_MAX_ATTEMPTS - 1; i++) {
      expect((await verifyAgentOtp(testPrisma, EMAIL, "000000")).ok).toBe(false);
    }
    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(true);
  });

  it("caps attempts under concurrent guessing", async () => {
    await makeAgent();
    const { code } = await issueAgentOtp(testPrisma, EMAIL);
    const attempts = OTP_MAX_ATTEMPTS + 3;
    const results = await Promise.all(
      Array.from({ length: attempts }, () => verifyAgentOtp(testPrisma, EMAIL, "000000"))
    );
    expect(results.every((r) => r.ok === false)).toBe(true);

    expect((await verifyAgentOtp(testPrisma, EMAIL, code!)).ok).toBe(false);

    const row = await testPrisma.agentOtp.findFirst();
    expect(row?.attempts).toBeLessThanOrEqual(OTP_MAX_ATTEMPTS);
  });
});
