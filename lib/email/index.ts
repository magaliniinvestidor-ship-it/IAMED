import { sendEmailViaResend } from './resend';
import type { SendEmailResult } from './resend';
import { sendEmailViaGmail } from './gmail';

export type { SendEmailResult };

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// Prioridade: Resend → Gmail SMTP → não configurado (modo simulado)
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY) return sendEmailViaResend(params);
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return sendEmailViaGmail(params);
  return { ok: false, error: 'not_configured' };
}

export { buildOtpEmailHtml } from './resend';
