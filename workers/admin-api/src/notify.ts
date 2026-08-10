import type { Env } from "./cors";

export type DecisionRecipient = { to: string; loginEmail?: string; tempPassword?: string };

export type NotifyOutcome = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
  error?: string;
};

/**
 * Asks the enquire Worker to send approval/rejection mail.
 * SMTP credentials live only on enquire-api — this Worker never sends mail itself.
 *
 * Never throws. The decision is already committed to Postgres by the time this
 * runs, so a mail failure must not surface as a failed approval.
 */
export async function notifyDecision(
  env: Env,
  input: {
    decision: "APPROVED" | "REJECTED";
    legalName: string;
    referenceNumber: string;
    reason?: string;
    recipients: DecisionRecipient[];
  }
): Promise<NotifyOutcome> {
  const base: NotifyOutcome = { attempted: false, sent: [], failed: [] };

  const portalBase = (env.VENDOR_PORTAL_URL || "").replace(/\/$/, "");
  if (!portalBase) {
    return { ...base, error: "VENDOR_PORTAL_URL is not configured — no mail sent." };
  }

  const enquireUrl = (env.ENQUIRE_WORKER_URL || "").replace(/\/$/, "");
  const enquireSecret = env.ENQUIRE_API_SECRET || "";
  if (!enquireUrl || !enquireSecret) {
    return { ...base, error: "Enquire worker is not configured — no mail sent." };
  }

  if (input.recipients.length === 0) {
    return { ...base, error: "No recipient addresses." };
  }

  try {
    const res = await fetch(`${enquireUrl}/notify/decision`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${enquireSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        decision: input.decision,
        legalName: input.legalName,
        referenceNumber: input.referenceNumber,
        reason: input.reason,
        portalUrl: `${portalBase}/login`,
        recipients: input.recipients,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as Partial<NotifyOutcome> & {
      error?: string;
    };

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
