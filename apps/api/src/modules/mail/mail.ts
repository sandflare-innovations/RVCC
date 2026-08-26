import type { Env } from "../../config/env";
import { isCloudflareWorkerRuntime } from "../../lib/runtime";

const BRAND = "#0073bc";

function shell(opts: { preheader: string; title: string; bodyHtml: string }): string {
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
  const subject = `Account Registered Successfully — ${referenceNumber}`;
  const html = shell({
    preheader: `Account registered successfully — ${referenceNumber}`,
    title: "Account Registered Successfully",
    bodyHtml: `
      <p style="margin:0 0 16px;">Thank you${legalName ? `, <strong>${legalName}</strong>` : ""}. Your supplier registration is <strong>complete</strong> and has been received by RVCC procurement.</p>
      <div style="margin:24px 0;padding:20px;background:#f4f4f5;border-left:4px solid ${BRAND};">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Reference number</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${referenceNumber}</p>
      </div>
      <p style="margin:0 0 12px;color:#27272a;font-size:14px;"><strong>Vendor portal access is on hold</strong> until RVCC releases it from User Management. You will receive a separate email when you can sign in.</p>
      <p style="margin:0;color:#71717a;font-size:13px;">Keep this reference for follow-up.</p>
    `,
  });
  const text = `Account Registered Successfully\n\nYour registration ${referenceNumber} is complete.\nVendor portal access is on hold until RVCC releases it.\n${legalName ? `Company: ${legalName}\n` : ""}\n— RVCC Procurement`;
  return { subject, html, text };
}

function accessReleasedEmailHtml(opts: {
  legalName: string;
  portalUrl: string;
  loginEmail: string;
  tempPassword?: string;
}) {
  const subject = "Access Your Vendor Portal — RVCC";
  const credentials = opts.tempPassword
    ? `
      <div style="margin:24px 0;padding:20px;border:2px solid ${BRAND};">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Portal sign-in</p>
        <p style="margin:0 0 6px;font-size:13px;">Email: <strong>${opts.loginEmail}</strong></p>
        <p style="margin:0;font-size:13px;">Temporary password: <strong style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:16px;color:${BRAND};">${opts.tempPassword}</strong></p>
      </div>
      <p style="margin:0 0 16px;color:#71717a;font-size:13px;">You will be asked to set a new password on first sign-in.</p>`
    : `<p style="margin:0 0 16px;color:#71717a;font-size:13px;">Sign in with your existing portal password.</p>`;

  const html = shell({
    preheader: "Your RVCC vendor portal access has been released",
    title: "Access Your Vendor Portal",
    bodyHtml: `
      <p style="margin:0 0 16px;">Good news${opts.legalName ? `, <strong>${opts.legalName}</strong>` : ""}. Your vendor portal access has been <strong>released</strong>.</p>
      ${credentials}
      <p style="margin:0 0 24px;"><a href="${opts.portalUrl}" style="background:${BRAND};color:#fff;padding:12px 20px;text-decoration:none;font-weight:700;display:inline-block;">Access Your Vendor Portal</a></p>
    `,
  });
  const text = `Access Your Vendor Portal\n\nYour RVCC vendor portal access has been released.\nPortal: ${opts.portalUrl}\nEmail: ${opts.loginEmail}\n${
    opts.tempPassword ? `Temporary password: ${opts.tempPassword}\n` : ""
  }\n— RVCC Procurement`;
  return { subject, html, text };
}

export function smtpConfigured(env: Env): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function fromAddress(env: Env): string {
  return env.ENQUIRE_FROM_EMAIL || env.SMTP_FROM || "RVCC Procurement <noreply@rvcc.local>";
}

function parseMailbox(raw: string): string | { name: string; email: string } {
  const angle = raw.trim().match(/^(.*)<([^>]+)>\s*$/);
  if (!angle) return raw.trim();
  const name = angle[1].trim().replace(/^"|"$/g, "");
  const email = angle[2].trim();
  return name ? { name, email } : email;
}

function approvedEmailHtml(opts: {
  legalName: string;
  referenceNumber: string;
  portalUrl: string;
  loginEmail?: string;
  tempPassword?: string;
}) {
  const subject = `RVCC Supplier Registration Approved — ${opts.referenceNumber}`;
  // Credentials are omitted for contacts who were not issued a login.
  const credentials =
    opts.loginEmail && opts.tempPassword
      ? `
      <div style="margin:24px 0;padding:20px;border:2px solid ${BRAND};">
        <p style="margin:0 0 12px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Portal sign-in</p>
        <p style="margin:0 0 6px;font-size:13px;">Email: <strong>${opts.loginEmail}</strong></p>
        <p style="margin:0;font-size:13px;">Temporary password: <strong style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:16px;color:${BRAND};">${opts.tempPassword}</strong></p>
      </div>
      <p style="margin:0 0 16px;">
        <a href="${opts.portalUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 24px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Sign in to the portal</a>
      </p>
      <p style="margin:0;color:#71717a;font-size:13px;">You will be asked to set a new password on first sign-in.</p>`
      : `<p style="margin:0;color:#71717a;font-size:13px;">Your administrative contact has been sent portal sign-in details separately.</p>`;

  const html = shell({
    preheader: `Registration ${opts.referenceNumber} approved`,
    title: "Registration Approved",
    bodyHtml: `
      <p style="margin:0 0 16px;">Good news${opts.legalName ? `, <strong>${opts.legalName}</strong>` : ""}. Your prospective supplier registration has been approved by RVCC procurement.</p>
      <div style="margin:24px 0;padding:20px;background:#f4f4f5;border-left:4px solid ${BRAND};">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Reference number</p>
        <p style="margin:0;font-size:20px;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${opts.referenceNumber}</p>
      </div>
      ${credentials}
    `,
  });

  const text = `RVCC Supplier Registration\n\nYour registration ${opts.referenceNumber} has been approved.\n${
    opts.loginEmail && opts.tempPassword
      ? `\nPortal: ${opts.portalUrl}\nEmail: ${opts.loginEmail}\nTemporary password: ${opts.tempPassword}\nYou will be asked to set a new password on first sign-in.\n`
      : ""
  }\n— RVCC Procurement`;

  return { subject, html, text };
}

function rejectedEmailHtml(opts: { legalName: string; referenceNumber: string; reason: string }) {
  const subject = `RVCC Supplier Registration Update — ${opts.referenceNumber}`;
  const html = shell({
    preheader: `Update on registration ${opts.referenceNumber}`,
    title: "Registration Update",
    bodyHtml: `
      <p style="margin:0 0 16px;">Thank you${opts.legalName ? `, <strong>${opts.legalName}</strong>` : ""} for your interest in supplying RVCC. After review, registration <strong>${opts.referenceNumber}</strong> has not been approved at this time.</p>
      <div style="margin:24px 0;padding:20px;background:#f4f4f5;border-left:4px solid #27272a;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Reviewer note</p>
        <p style="margin:0;font-size:14px;color:#27272a;">${opts.reason}</p>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">You are welcome to submit a new registration once these points have been addressed.</p>
    `,
  });
  const text = `RVCC Supplier Registration\n\nRegistration ${opts.referenceNumber} was not approved at this time.\n\nReviewer note: ${opts.reason}\n\n— RVCC Procurement`;
  return { subject, html, text };
}

async function sendMail(
  env: Env,
  opts: { to: string; subject: string; text: string; html: string }
): Promise<void> {
  if (!smtpConfigured(env)) {
    throw new Error("SMTP is not configured on the Worker");
  }

  const port = Number(env.SMTP_PORT || 587);
  const implicitTls = port === 465 || env.SMTP_SECURE === "true";
  const from = fromAddress(env);

  // Nodemailer cannot open TCP sockets on Cloudflare Workers; mail would fail
  // silently if we fire-and-forget. worker-mailer uses cloudflare:sockets.
  if (isCloudflareWorkerRuntime()) {
    const { WorkerMailer } = await import("worker-mailer");
    await WorkerMailer.send(
      {
        host: env.SMTP_HOST!,
        port,
        secure: implicitTls,
        startTls: !implicitTls,
        credentials: {
          username: env.SMTP_USER!,
          password: env.SMTP_PASS!,
        },
        authType: ["plain", "login"],
      },
      {
        from: parseMailbox(from),
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }
    );
    return;
  }

  const nodemailerMod = await import("nodemailer");
  const nodemailer = nodemailerMod.default ?? nodemailerMod;
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
    from,
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

export async function sendAccessReleasedEmail(
  env: Env,
  to: string,
  opts: {
    legalName: string;
    portalUrl: string;
    loginEmail: string;
    tempPassword?: string;
  }
): Promise<void> {
  const { subject, html, text } = accessReleasedEmailHtml(opts);
  await sendMail(env, { to, subject, html, text });
}

export async function sendApprovedEmail(
  env: Env,
  to: string,
  opts: {
    legalName: string;
    referenceNumber: string;
    portalUrl: string;
    loginEmail?: string;
    tempPassword?: string;
  }
): Promise<void> {
  const { subject, html, text } = approvedEmailHtml(opts);
  await sendMail(env, { to, subject, html, text });
}

export async function sendRejectedEmail(
  env: Env,
  to: string,
  opts: { legalName: string; referenceNumber: string; reason: string }
): Promise<void> {
  const { subject, html, text } = rejectedEmailHtml(opts);
  await sendMail(env, { to, subject, html, text });
}

/**
 * Invitation to quote. Deliberately carries scope, project and deadline but
 * NEVER the selling price — that is RVCC's internal number, and an email is the
 * easiest place in the system to leak it by accident.
 */
function requirementPostedEmailHtml(opts: {
  project: string;
  scopeOfWork: string;
  referenceNumber: string;
  closesAt: string;
  portalUrl: string;
}) {
  const subject = `RVCC — Request for quotation: ${opts.project}`;
  const html = shell({
    preheader: `RVCC invites your quotation for ${opts.project}`,
    title: "Request for Quotation",
    bodyHtml: `
      <p style="margin:0 0 16px;">RVCC invites your quotation for the work below.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#71717a;font-size:13px;">Reference</td><td style="padding:6px 0;font-weight:600;">${opts.referenceNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:13px;">Project</td><td style="padding:6px 0;font-weight:600;">${opts.project}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:13px;">Closes</td><td style="padding:6px 0;font-weight:600;">${opts.closesAt}</td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Scope of work</p>
      <p style="margin:0 0 24px;white-space:pre-wrap;">${opts.scopeOfWork}</p>
      <p style="margin:0 0 24px;"><a href="${opts.portalUrl}" style="background:${BRAND};color:#fff;padding:12px 20px;text-decoration:none;font-weight:700;display:inline-block;">Submit your quotation</a></p>
      <p style="margin:0;color:#71717a;font-size:13px;">Your price is visible only to RVCC. Other invited suppliers cannot see it.</p>
    `,
  });
  const text = `RVCC — Request for Quotation\n\nReference: ${opts.referenceNumber}\nProject: ${opts.project}\nCloses: ${opts.closesAt}\n\nScope of work:\n${opts.scopeOfWork}\n\nSubmit your quotation: ${opts.portalUrl}\n\n— RVCC Procurement`;
  return { subject, html, text };
}

/** Award confirmation to the winning supplier. No prices from other suppliers. */
function awardEmailHtml(opts: { project: string; referenceNumber: string; portalUrl: string }) {
  const subject = `RVCC — Award confirmation: ${opts.project}`;
  const html = shell({
    preheader: `RVCC has awarded ${opts.project} to your quotation`,
    title: "Award Confirmation",
    bodyHtml: `
      <p style="margin:0 0 16px;">We are pleased to confirm that RVCC has awarded the following work to your quotation.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#71717a;font-size:13px;">Reference</td><td style="padding:6px 0;font-weight:600;">${opts.referenceNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a;font-size:13px;">Project</td><td style="padding:6px 0;font-weight:600;">${opts.project}</td></tr>
      </table>
      <p style="margin:0 0 24px;"><a href="${opts.portalUrl}" style="background:${BRAND};color:#fff;padding:12px 20px;text-decoration:none;font-weight:700;display:inline-block;">View in your portal</a></p>
      <p style="margin:0;color:#71717a;font-size:13px;">RVCC Procurement will be in touch with next steps.</p>
    `,
  });
  const text = `RVCC — Award Confirmation\n\nReference: ${opts.referenceNumber}\nProject: ${opts.project}\n\nRVCC has awarded this work to your quotation.\n\nView in your portal: ${opts.portalUrl}\n\n— RVCC Procurement`;
  return { subject, html, text };
}

export async function sendRequirementPostedEmail(
  env: Env,
  to: string,
  opts: {
    project: string;
    scopeOfWork: string;
    referenceNumber: string;
    closesAt: string;
    portalUrl: string;
  }
): Promise<void> {
  const { subject, html, text } = requirementPostedEmailHtml(opts);
  await sendMail(env, { to, subject, html, text });
}

export async function sendAwardEmail(
  env: Env,
  to: string,
  opts: { project: string; referenceNumber: string; portalUrl: string }
): Promise<void> {
  const { subject, html, text } = awardEmailHtml(opts);
  await sendMail(env, { to, subject, html, text });
}

// ── Admin Password Change OTP ─────────────────────────────────────────────

function adminPasswordChangeOtpHtml(code: string, expiresMinutes: number) {
  const subject = "RVCC Admin — Password Change Verification";
  const html = shell({
    preheader: `Your RVCC password change code is ${code}`,
    title: "Password Change Code",
    bodyHtml: `
      <p style="margin:0 0 16px;">A password change was requested for your admin account. Use the code below to verify.</p>
      <div style="margin:24px 0;padding:20px;border:2px solid ${BRAND};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">Verification code</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.25em;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${code}</p>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">Expires in <strong>${expiresMinutes} minutes</strong>. If you did not request this, change your password immediately.</p>
    `,
  });
  const text = `RVCC Admin — Password Change\n\nYour verification code is ${code}.\nIt expires in ${expiresMinutes} minutes.\nIf you did not request this, change your password immediately.\n\n— RVCC Procurement`;
  return { subject, html, text };
}

export async function sendAdminPasswordChangeOtp(
  env: Env,
  to: string,
  code: string,
  expiresMinutes = 10
): Promise<void> {
  const { subject, html, text } = adminPasswordChangeOtpHtml(code, expiresMinutes);
  await sendMail(env, { to, subject, html, text });
}
