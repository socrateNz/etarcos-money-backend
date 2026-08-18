/**
 * Minimal mail sender. No SMTP/email provider credentials exist in this
 * project yet, so by default this just logs the message to the server
 * console (visible in `npm run dev` output) — enough to test flows like
 * password reset locally today. Once real credentials are available
 * (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS), wire an actual transport
 * here; every caller of `sendMail` stays unchanged.
 */
export async function sendMail(to: string, subject: string, body: string) {
  if (process.env.SMTP_HOST) {
    console.warn('SMTP_HOST is set but no SMTP transport is wired up yet — falling back to console logging.');
  }

  console.log(`\n📧 [DEV MAIL] To: ${to}\nSubject: ${subject}\n${body}\n`);
}
