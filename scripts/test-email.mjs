import { readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const line of readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n")) {
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

const to = process.argv[2] ?? "tc@toolqz.com";
const { sendEmail } = await import("../src/lib/email.ts");

const result = await sendEmail({
  to,
  toName: "Tiago",
  subject: "TOOLQZ — Brevo email test",
  text: "This is a test email from TOOLQZ.\n\nIf you received this, Brevo is configured correctly.\n\n— TOOLQZ",
  html: "<p>This is a <strong>test email</strong> from TOOLQZ.</p><p>If you received this, Brevo is configured correctly.</p><p>— TOOLQZ</p>",
});

console.log(JSON.stringify({ to, ok: result.ok, dev: result.dev }));
