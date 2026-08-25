const RESEND_API_URL = 'https://api.resend.com/emails';

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: 'not_configured' | string;
}

interface ResendErrorResponse {
  message?: string;
  name?: string;
}

export async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'not_configured' };

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'IAMED <onboarding@resend.dev>',
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data: { id?: string } & ResendErrorResponse = await res.json().catch(() => ({}) as ResendErrorResponse);
    if (!res.ok) {
      return { ok: false, error: data.message || data.name || `HTTP ${res.status}` };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function buildOtpEmailHtml(code: string, expiresInMinutes = 10): string {
  const digits = code
    .split('')
    .map((d) => `<td style="padding:0 8px;"><div style="width:52px;height:64px;background:#0f5370;border-radius:12px;color:#ffffff;font-size:32px;font-weight:bold;line-height:64px;text-align:center;font-family:Arial,sans-serif;">${d}</div></td>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#00a884;padding:20px 28px;">
      <span style="color:#ffffff;font-size:22px;font-weight:bold;">⚕️ IAMED</span>
    </div>
    <div style="padding:28px;">
      <h1 style="margin:0 0 12px;font-size:18px;color:#0f5370;">Código de verificação</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.6;">
        Use o código abaixo para concluir seu login. Ele expira em ${expiresInMinutes} minutos.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>${digits}</tr></table>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
        Se você não solicitou este código, ignore este e-mail. Nunca compartilhe este código com ninguém.
      </p>
    </div>
  </div>
</body>
</html>`;
}
