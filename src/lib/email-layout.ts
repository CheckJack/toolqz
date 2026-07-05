/** TOOLQZ transactional email shell — light outer background, dark content card. */

const COLORS = {
  page: "#ffffff",
  header: "#272727",
  card: "#303030",
  border: "#3d3d3d",
  text: "#ffffff",
  muted: "#b4b4b4",
  mutedDim: "#9a9a9a",
  accent: "#6db4e8",
  accentText: "#18181b",
  footer: "#8a8a8a",
} as const;

export function emailAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://toolqz.com").replace(/\/$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
      <tr>
        <td class="email-btn" bgcolor="${COLORS.accent}" style="border-radius:8px;background-color:${COLORS.accent};">
          <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${COLORS.accentText};text-decoration:none;border-radius:8px;">
            ${safeLabel}
          </a>
        </td>
      </tr>
    </table>
  `.trim();
}

export function emailParagraph(html: string): string {
  return `<p class="email-text" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${COLORS.text};">${html}</p>`;
}

export function emailMutedParagraph(html: string): string {
  return `<p class="email-muted" style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:${COLORS.mutedDim};">${html}</p>`;
}

export function emailDivider(): string {
  return `<hr style="border:none;border-top:1px solid ${COLORS.border};margin:24px 0;" />`;
}

export function wrapEmailHtml(options: {
  title: string;
  preheader?: string;
  bodyHtml: string;
}): string {
  const appUrl = emailAppUrl();
  const preheader = options.preheader
    ? escapeHtml(options.preheader)
    : escapeHtml(options.title);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(options.title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: ${COLORS.accent}; }
    @media (prefers-color-scheme: dark) {
      .email-page { background-color: ${COLORS.page} !important; }
      .email-shell { border-color: ${COLORS.border} !important; }
      .email-header { background-color: ${COLORS.header} !important; }
      .email-card { background-color: ${COLORS.card} !important; }
      .email-text { color: ${COLORS.text} !important; }
      .email-muted { color: ${COLORS.mutedDim} !important; }
      .email-footer { color: ${COLORS.footer} !important; }
      .email-btn { background-color: ${COLORS.accent} !important; }
      .email-logo-text { color: ${COLORS.text} !important; }
      .email-logo-accent { color: ${COLORS.accent} !important; }
    }
  </style>
</head>
<body class="email-page" bgcolor="${COLORS.page}" style="margin:0;padding:0;background-color:${COLORS.page};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-page" bgcolor="${COLORS.page}" style="background-color:${COLORS.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-shell" style="max-width:560px;border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">
          <tr>
            <td class="email-header" bgcolor="${COLORS.header}" style="background-color:${COLORS.header};border-bottom:1px solid ${COLORS.border};padding:20px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${escapeHtml(appUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                      <span class="email-logo-text" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.03em;color:${COLORS.text};">TOOL</span><span class="email-logo-accent" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.03em;color:${COLORS.accent};">QZ</span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.mutedDim};">Admin</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-card" bgcolor="${COLORS.card}" style="background-color:${COLORS.card};padding:28px 24px 24px;">
              ${options.bodyHtml}
              ${emailDivider()}
              <p class="email-footer" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${COLORS.footer};">
                © ${new Date().getFullYear()} TOOLQZ · <a href="${escapeHtml(appUrl)}" style="color:${COLORS.accent};text-decoration:none;">toolqz.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
