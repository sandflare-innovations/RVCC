import type { Env } from "../../config/env";
import {
  sendApprovedEmail,
  sendAwardEmail,
  sendRejectedEmail,
  sendRequirementPostedEmail,
} from "../mail/mail";

export type DecisionRecipient = { to: string; loginEmail?: string; tempPassword?: string };

export type NotifyOutcome = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
  error?: string;
};

/**
 * Sends approval/rejection mail in-process (SMTP lives in this API).
 * Never throws — the decision is already committed before this runs.
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

  if (input.recipients.length === 0) {
    return { ...base, error: "No recipient addresses." };
  }

  const portalUrl = `${portalBase}/login`;
  const sent: string[] = [];
  const failed: { to: string; error: string }[] = [];

  for (const r of input.recipients) {
    try {
      if (input.decision === "APPROVED") {
        await sendApprovedEmail(env, r.to, {
          legalName: input.legalName,
          referenceNumber: input.referenceNumber,
          portalUrl,
          loginEmail: r.loginEmail,
          tempPassword: r.tempPassword,
        });
      } else {
        await sendRejectedEmail(env, r.to, {
          legalName: input.legalName,
          referenceNumber: input.referenceNumber,
          reason: input.reason || "",
        });
      }
      sent.push(r.to);
    } catch (err) {
      failed.push({ to: r.to, error: (err as Error).message || "send failed" });
    }
  }

  return { attempted: true, sent, failed };
}

export type RequirementMailOutcome = {
  attempted: boolean;
  sent: string[];
  failed: { to: string; error: string }[];
};

/**
 * Sends requirement posted/awarded mail in-process. Never throws.
 */
export async function sendRequirementMail(
  env: Env,
  input: {
    kind: "POSTED" | "AWARDED";
    recipients: string[];
    project: string;
    scopeOfWork?: string;
    referenceNumber: string;
    closesAt?: string;
    portalUrl: string;
  }
): Promise<RequirementMailOutcome> {
  const base: RequirementMailOutcome = { attempted: false, sent: [], failed: [] };
  if (input.recipients.length === 0) return base;

  const sent: string[] = [];
  const failed: { to: string; error: string }[] = [];

  for (const to of input.recipients) {
    try {
      if (input.kind === "POSTED") {
        await sendRequirementPostedEmail(env, to, {
          project: input.project,
          scopeOfWork: input.scopeOfWork || "",
          referenceNumber: input.referenceNumber,
          closesAt: input.closesAt || "",
          portalUrl: input.portalUrl,
        });
      } else {
        await sendAwardEmail(env, to, {
          project: input.project,
          referenceNumber: input.referenceNumber,
          portalUrl: input.portalUrl,
        });
      }
      sent.push(to);
    } catch (err) {
      failed.push({ to, error: (err as Error).message || "send failed" });
    }
  }

  return { attempted: true, sent, failed };
}
