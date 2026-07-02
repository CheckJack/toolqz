import nodemailer from "nodemailer";

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  toName?: string;
}

export function parseFromAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: "TOOLQZ", email: raw.trim() };
}

function usesSmtpRelay(apiKey: string) {
  return apiKey.startsWith("xsmtpsib-");
}

export function isEmailConfigured(): boolean {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return false;
  if (usesSmtpRelay(apiKey)) {
    return Boolean(
      process.env.BREVO_SMTP_USER?.trim() ||
        process.env.PARTNER_INQUIRY_EMAIL?.trim() ||
        parseFromAddress(process.env.NOTIFY_FROM_EMAIL ?? "").email
    );
  }
  return true;
}

async function sendViaSmtp(
  apiKey: string,
  sender: { name: string; email: string },
  input: SendEmailInput
) {
  const smtpUser =
    process.env.BREVO_SMTP_USER?.trim() ||
    process.env.PARTNER_INQUIRY_EMAIL?.trim() ||
    sender.email;

  const transport = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: apiKey,
    },
  });

  await transport.sendMail({
    from: `"${sender.name}" <${sender.email}>`,
    to: input.toName ? `"${input.toName}" <${input.to}>` : input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br />"),
  });
}

async function sendViaApi(
  apiKey: string,
  sender: { name: string; email: string },
  input: SendEmailInput
) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: input.to, name: input.toName ?? input.to }],
      subject: input.subject,
      textContent: input.text,
      htmlContent: input.html ?? input.text.replace(/\n/g, "<br />"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Email failed: ${detail}`);
  }
}

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromRaw =
    process.env.NOTIFY_FROM_EMAIL?.trim() ?? "TOOLQZ <noreply@toolqz.com>";
  const sender = parseFromAddress(fromRaw);

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email:dev]", {
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
    } else {
      console.warn("[email] BREVO_API_KEY is not set — email not sent:", input.subject);
    }
    return { ok: true, dev: true as const };
  }

  if (usesSmtpRelay(apiKey)) {
    await sendViaSmtp(apiKey, sender, input);
  } else {
    await sendViaApi(apiKey, sender, input);
  }

  return { ok: true, dev: false as const };
}
