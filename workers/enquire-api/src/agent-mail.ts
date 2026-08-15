import { type Env, json } from "./cors";
import { BRAND, sendMail, shell, smtpConfigured } from "./mail";

function agentOtpEmail(code: string, expiresMinutes: number) {
  const subject = "RVCC Agent Portal — Access Code";
  const html = shell({
    preheader: `Your RVCC portal access code is ${code}`,
    title: "Access Code",
    bodyHtml: `
      <p style="margin:0 0 16px;">Use this one-time code to sign in to the RVCC agent portal.</p>
      <div style="margin:24px 0;padding:20px;border:2px solid ${BRAND};text-align:center;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#a1a1aa;font-weight:700;">One-time code</p>
        <p style="margin:0;font-size:32px;letter-spacing:0.25em;font-weight:800;color:${BRAND};font-family:ui-monospace,Menlo,Consolas,monospace;">${code}</p>
      </div>
      <p style="margin:0;color:#71717a;font-size:13px;">Expires in <strong>${expiresMinutes} minutes</strong>. Do not share this code.</p>
    `,
  });
  const text = `RVCC Agent Portal\n\nYour one-time access code is ${code}.\nIt expires in ${expiresMinutes} minutes.\n\n— RVCC Procurement`;
  return { subject, html, text };
}

export async function handleAgentOtpMail(env: Env, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    to?: string;
    code?: string;
    expiresMinutes?: number;
  } | null;

  const to = body?.to?.trim();
  const code = body?.code?.trim();
  const expiresMinutes = body?.expiresMinutes ?? 15;

  if (!to || !code || !/^\d{6}$/.test(code)) {
    return json(env, request, { error: "to and a 6-digit code are required" }, 400);
  }

  if (!smtpConfigured(env)) {
    console.error("[agent-mail] SMTP is not configured");
    return json(env, request, { error: "Mail is not configured" }, 503);
  }

  const { subject, text, html } = agentOtpEmail(code, expiresMinutes);
  await sendMail(env, { to, subject, html, text });
  return json(env, request, { ok: true });
}
