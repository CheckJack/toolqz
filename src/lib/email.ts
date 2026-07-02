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

export function isEmailConfigured(): boolean {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) return false;
  if (apiKey.startsWith("xsmtpsib-")) {
    return Boolean(
      process.env.BREVO_SMTP_USER?.trim() ||
        process.env.PARTNER_INQUIRY_EMAIL?.trim() ||
        parseFromAddress(process.env.NOTIFY_FROM_EMAIL ?? "").email
    );
  }
  return true;
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

  if (apiKey.startsWith("xsmtpsib-")) {
    throw new Error(
      "Brevo SMTP keys (xsmtpsib-) are not supported in production. Use an xkeysib- API key from Brevo → SMTP & API → API keys."
    );
  }

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

  return { ok: true, dev: false as const };
}
