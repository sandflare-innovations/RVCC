import type { Env } from "../../config/env";

interface OutbidAlertParams {
  requirementId: string;
  projectName: string;
  referenceNumber: string;
  overtakenVendorEmail: string;
  overtakenVendorName?: string | null;
  newLowestPrice: number | string;
  currency: string;
  portalUrl: string;
}

// Cooldown tracker to prevent inbox spam (vendorEmail:requirementId -> timestamp)
const outbidCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Sends a high-priority outbid alert email to a supplier who just lost Rank #1.
 */
export async function sendOutbidAlertEmail(
  env: Env,
  params: OutbidAlertParams
): Promise<boolean> {
  const cooldownKey = `${params.overtakenVendorEmail}:${params.requirementId}`;
  const lastSent = outbidCooldowns.get(cooldownKey);
  const now = Date.now();

  if (lastSent && now - lastSent < COOLDOWN_MS) {
    return false; // Skip if sent in last 5 minutes
  }

  const requirementUrl = `${params.portalUrl}/requirements/${encodeURIComponent(params.requirementId)}`;
  const subject = `⚠️ Outbid Alert: ${params.projectName} (${params.referenceNumber})`;
  const formattedPrice = `${Number(params.newLowestPrice).toLocaleString()} ${params.currency}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 9999px; background-color: #fef3c7; color: #92400e; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 12px 0 6px 0; }
    .price-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px; margin-top: 16px; }
    .footer { font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Action Recommended</span>
      <h1 class="title">You Have Been Outbid</h1>
      <p style="margin: 0; color: #64748b; font-size: 14px;">A competitor just placed a lower bid on <strong>${params.projectName}</strong>.</p>
    </div>

    <div class="price-box">
      <div style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase;">Current Leading L1 Offer</div>
      <div style="font-size: 26px; font-weight: 900; color: #15803d; margin-top: 4px;">${formattedPrice}</div>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      You can defend your position and regain the #1 Rank by submitting a revised lower quote before the tender closes.
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${requirementUrl}" class="btn">Revise My Bid Now →</a>
    </div>

    <div class="footer">
      RVCC Enterprise Procurement Portal &bull; Blind Reverse Auction Engine
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { smtpConfigured } = await import("../mail/mail");
    if (smtpConfigured(env)) {
      const nodemailerMod = await import("nodemailer");
      const nodemailer = nodemailerMod.default ?? nodemailerMod;
      const port = Number(env.SMTP_PORT || 587);
      const implicitTls = port === 465 || env.SMTP_SECURE === "true";
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port,
        secure: implicitTls,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      await transport.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER || "procurement@rvcc.com.sa",
        to: params.overtakenVendorEmail,
        subject,
        text: `You have been outbid on ${params.projectName}. Current lowest bid is ${formattedPrice}. Revise your quote here: ${requirementUrl}`,
        html,
      });
    }

    outbidCooldowns.set(cooldownKey, now);
    return true;
  } catch (err) {
    console.warn("[sendOutbidAlertEmail] delivery failed", err);
    return false;
  }
}
