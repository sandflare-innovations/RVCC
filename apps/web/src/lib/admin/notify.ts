import "server-only";

import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

export type DecisionRecipient = { to: string; loginEmail?: string; tempPassword?: string };

export type NotifyOutcome = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
  error?: string;
};

/**
 * Asks the Worker to send approval/rejection mail. SMTP credentials live only
 * on the Worker, so Next.js cannot send directly.
 *
 * Never throws. The decision is already committed to Postgres by the time this
 * runs, so a mail failure must not surface as a failed approval — the caller
 * reports the outcome and falls back to showing credentials in the UI.
 */
export async function notifyDecision(input: {
  decision: "APPROVED" | "REJECTED";
  legalName: string;
  referenceNumber: string;
  reason?: string;
  recipients: DecisionRecipient[];
  origin: string;
}): Promise<NotifyOutcome> {
  const base: NotifyOutcome = { attempted: false, sent: [], failed: [] };

  if (!workerConfigured()) {
    return { ...base, error: "Worker is not configured — no mail sent." };
  }
  if (input.recipients.length === 0) {
    return { ...base, error: "No recipient addresses." };
  }

  try {
    const res = await enquireWorkerFetch("/notify/decision", {
      method: "POST",
      // Admin acts on its own authority; no vendor session should be attached.
      sessionToken: null,
      body: {
        decision: input.decision,
        legalName: input.legalName,
        referenceNumber: input.referenceNumber,
        reason: input.reason,
        portalUrl: `${input.origin}/vendor/login`,
        recipients: input.recipients,
      },
    });

    const data = (await res.json().catch(() => ({}))) as Partial<NotifyOutcome> & {
      error?: string;
    };

    // 207 means partial success — some addresses sent, some did not.
    if (!res.ok && res.status !== 207) {
      return {
        ...base,
        attempted: true,
        error: data.error || `Mail service returned ${res.status}`,
      };
    }

    return {
      attempted: true,
      sent: data.sent ?? [],
      failed: data.failed ?? [],
    };
  } catch (err) {
    console.error("[notify/decision]", err);
    return { ...base, attempted: true, error: "Could not reach the mail service." };
  }
}
