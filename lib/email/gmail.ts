import nodemailer from 'nodemailer';
import type { SendEmailResult } from './resend';

export async function sendEmailViaGmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const user = process.env.GMAIL_USER || '';
  const appPassword = process.env.GMAIL_APP_PASSWORD || '';
  if (!user || !appPassword) return { ok: false, error: 'not_configured' };

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: appPassword.replace(/\s+/g, '') },
    });

    const info = await transporter.sendMail({
      from: `IAMED <${user}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    return { ok: true, id: info.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
