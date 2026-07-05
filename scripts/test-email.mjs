import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const to = process.argv[2] ?? "tc@toolqz.com";
const template = process.argv[3] ?? "password-reset";

const { adminPasswordResetEmail, brandedEmailPreview } = await import(
  "../src/lib/email-templates.ts"
);
const { sendEmail } = await import("../src/lib/email.ts");

const mail =
  template === "preview"
    ? brandedEmailPreview()
    : adminPasswordResetEmail("Tiago", "test-preview-token-not-valid");
const result = await sendEmail({
  to,
  toName: "Tiago",
  subject: mail.subject,
  text: mail.text,
  html: mail.html,
});

console.log(JSON.stringify({ to, ok: result.ok, dev: result.dev, subject: mail.subject }));
