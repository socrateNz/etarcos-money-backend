import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '@/config/env.config';

let transporter: Transporter | null | undefined;

/**
 * Lazily builds (and caches) the SMTP transport from env vars. Returns null
 * when SMTP isn't configured, so callers can fall back to console logging —
 * keeps local dev working without requiring real mail credentials.
 */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? Number(env.SMTP_PORT) : 587,
    secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });

  return transporter;
}

export async function sendMail(to: string, subject: string, body: string) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`\n📧 [DEV MAIL] To: ${to}\nSubject: ${subject}\n${body}\n`);
    return;
  }

  await transport.sendMail({
    from: `"Tacynt Money" <${env.SMTP_USER}>`,
    to,
    subject,
    text: body,
  });
}
