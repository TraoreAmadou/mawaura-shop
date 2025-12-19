import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = mustEnv("MAWAURA_FROM_EMAIL");
  const replyTo = process.env.MAWAURA_REPLY_TO || undefined;

  // Ne pas casser l'API si l'email échoue
  try {
    await resend.emails.send({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo,
    });
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
}
