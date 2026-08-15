import nodemailer from "nodemailer";

import type { Env } from "./cors";

export const BRAND = "#0073bc";

export function shell(opts: { preheader: string; title: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e4e4e7;">
          <tr>
            <td style="background:${BRAND};padding:28px 32px;">
              <p style="margin:0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(255,255,255,0.7);font-weight:700;">RVCC Procurement</p>
              <h1 style="margin:10px 0 0;font-size:22px;line-height:1.2;letter-spacing:-0.02em;text-transform:uppercase;color:#ffffff;font-weight:800;">${opts.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#27272a;font-size:14px;line-height:1.6;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f4f4f5;background:#fafafa;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Riyadh Valley Contracting Company</p>
              <p style="margin:8px 0 0;font-size:12px;color:#71717a;line-height:1.5;">
                This message was sent regarding supplier registration. If you did not request it, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpEmailHtml(code: string, expiresMinutes: number) {
  const subject = "RVCC Supplier Registration — Access Code";
  const html = shell({
    preheader: `Your RVCC access code is ${code}`,
    title: "Access Code",
    bodyHtml: `
      <p style="margin:0 0 16px;">Use this one-time code to continue your prospective supplier registration with RVCC.</p>
      <div style="margin:24px 0;padding:20px;border:2px solid ${BRAND};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">One-time code</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.25em;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${code}</p>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">Expires in <strong>${expiresMinutes} minutes</strong>. Do not share this code.</p>
    `,
  });
  const text = `RVCC Supplier Registration\n\nYour one-time access code is ${code}.\nIt expires in ${expiresMinutes} minutes.\n\n— RVCC Procurement`;
  return { subject, html, text };
}

function submittedEmailHtml(referenceNumber: string, legalName: string) {
  const subject = `RVCC Supplier Registration Received — ${referenceNumber}`;
  const html = shell({
    preheader: `Request ${referenceNumber} received`,
    title: "Request Received",
    bodyHtml: `
      <p style="margin:0 0 16px;">Thank you${legalName ? `, <strong>${legalName}</strong>` : ""}. Your prospective supplier registration has been submitted to RVCC procurement for review.</p>
      <div style="margin:24px 0;padding:20px;background:#f4f4f5;border-left:4px solid ${BRAND};">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Reference number</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${referenceNumber}</p>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">Keep this reference for follow-up. We will notify your administrative contact when a decision is made.</p>
    `,
  });
  const text = `RVCC Supplier Registration\n\nYour request ${referenceNumber} has been received.\n${legalName ? `Company: ${legalName}\n` : ""}\n— RVCC Procurement`;
  return { subject, html, text };
}

export function smtpConfigured(env: Env): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function fromAddress(env: Env): string {
  return env.ENQUIRE_FROM_EMAIL || env.SMTP_FROM || "RVCC Procurement <noreply@rvcc.local>";
}

export async function sendMail(
  env: Env,
  opts: { to: string; subject: string; text: string; html: string }
): Promise<void> {
  if (!smtpConfigured(env)) {
    throw new Error("SMTP is not configured on the Worker");
  }

  const port = Number(env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465 || env.SMTP_SECURE === "true",
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: fromAddress(env),
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export async function sendOtpEmail(
  env: Env,
  to: string,
  code: string,
  expiresMinutes = 15
): Promise<void> {
  const { subject, html, text } = otpEmailHtml(code, expiresMinutes);
  await sendMail(env, { to, subject, html, text });
}

export async function sendSubmittedEmail(
  env: Env,
  to: string,
  opts: { referenceNumber: string; legalName: string }
): Promise<void> {
  const { subject, html, text } = submittedEmailHtml(opts.referenceNumber, opts.legalName);
  await sendMail(env, { to, subject, html, text });
}
