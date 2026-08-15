import "server-only";

import { OTP_TTL_MS } from "@/lib/auth/constants";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

/**
 * Sends an agent access code by asking the Cloudflare Worker to mail it.
 * SMTP credentials live only on the Worker and must never reach this app.
 * Never returns the code, and never logs it.
 */
export async function sendAgentOtpEmail(
  to: string,
  code: string
): Promise<{ sent: boolean; error?: string }> {
  if (!workerConfigured()) {
    return { sent: false, error: "Mail worker is not configured" };
  }

  try {
    const res = await enquireWorkerFetch("/mail/agent-otp", {
      method: "POST",
      sessionToken: null,
      body: { to, code, expiresMinutes: Math.round(OTP_TTL_MS / 60000) },
    });
    if (!res.ok) {
      return { sent: false, error: `Mail worker returned ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[mail-client] agent OTP send failed", err);
    return { sent: false, error: "Mail worker unreachable" };
  }
}
