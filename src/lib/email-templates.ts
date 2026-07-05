import {
  emailAppUrl,
  emailButton,
  emailMutedParagraph,
  emailParagraph,
  escapeHtml,
  wrapEmailHtml,
} from "./email-layout";

const appUrl = emailAppUrl;

export function adminPasswordResetEmail(name: string, token: string) {
  const resetUrl = `${appUrl()}/admin/reset-password?token=${encodeURIComponent(token)}`;
  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your TOOLQZ admin password.",
    "",
    `Reset your password (link expires in 1 hour):`,
    resetUrl,
    "",
    "If you didn't request this, you can ignore this email. Your password won't change.",
    "",
    "— The TOOLQZ team",
  ].join("\n");

  const bodyHtml = [
    emailParagraph(`Hi ${escapeHtml(name)},`),
    emailParagraph(
      `We received a request to reset your <strong style="color:#ffffff;">TOOLQZ</strong> admin password.`
    ),
    emailButton(resetUrl, "Reset password"),
    emailMutedParagraph(
      "This link expires in 1 hour. If you didn&apos;t request this, you can ignore this email — your password won&apos;t change."
    ),
  ].join("\n");

  const html = wrapEmailHtml({
    title: "Reset your TOOLQZ admin password",
    preheader: "Reset your admin password — link expires in 1 hour",
    bodyHtml,
  });

  return {
    subject: "Reset your TOOLQZ admin password",
    text,
    html,
    resetUrl,
  };
}

export function welcomeNewsletterEmail(name: string | null) {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const text = [
    greeting,
    "",
    "Thanks for subscribing to TOOLQZ — you'll get our best tool picks, reviews, and updates in your inbox.",
    "",
    "We only send what we'd actually read ourselves. No spam.",
    "",
    `Browse the directory: ${appUrl()}`,
    "",
    "— The TOOLQZ team",
  ].join("\n");

  const bodyHtml = [
    emailParagraph(escapeHtml(greeting)),
    emailParagraph(
      `Thanks for subscribing to <strong style="color:#ffffff;">TOOLQZ</strong> — you&apos;ll get our best tool picks, reviews, and updates in your inbox.`
    ),
    emailParagraph("We only send what we&apos;d actually read ourselves. No spam."),
    emailButton(appUrl(), "Browse the directory"),
  ].join("\n");

  const html = wrapEmailHtml({
    title: "You're on the TOOLQZ list",
    preheader: "Thanks for subscribing — tool picks and updates ahead",
    bodyHtml,
  });

  return {
    subject: "You're on the TOOLQZ list",
    text,
    html,
  };
}

export function partnerInquiryEmail(input: {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  website: string | null;
  productLabel: string;
  message: string;
}) {
  const text = [
    `New work-with-us inquiry (${input.id})`,
    "",
    `Company: ${input.companyName}`,
    `Contact: ${input.contactName}`,
    `Email: ${input.email}`,
    `Website: ${input.website ?? "—"}`,
    `Type: ${input.productLabel}`,
    "",
    input.message,
  ].join("\n");

  const websiteCell = input.website
    ? `<a href="${escapeHtml(input.website)}" style="color:#6db4e8;">${escapeHtml(input.website)}</a>`
    : "—";

  const bodyHtml = [
    emailParagraph(`<strong style="color:#ffffff;">New work-with-us inquiry</strong>`),
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#b4b4b4;">
      <tr><td style="padding:6px 0;color:#9a9a9a;width:88px;vertical-align:top;">Company</td><td style="padding:6px 0;color:#ffffff;">${escapeHtml(input.companyName)}</td></tr>
      <tr><td style="padding:6px 0;color:#9a9a9a;vertical-align:top;">Contact</td><td style="padding:6px 0;color:#ffffff;">${escapeHtml(input.contactName)}</td></tr>
      <tr><td style="padding:6px 0;color:#9a9a9a;vertical-align:top;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(input.email)}" style="color:#6db4e8;">${escapeHtml(input.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#9a9a9a;vertical-align:top;">Website</td><td style="padding:6px 0;">${websiteCell}</td></tr>
      <tr><td style="padding:6px 0;color:#9a9a9a;vertical-align:top;">Type</td><td style="padding:6px 0;color:#ffffff;">${escapeHtml(input.productLabel)}</td></tr>
    </table>`,
    emailParagraph(escapeHtml(input.message).replace(/\n/g, "<br />")),
    emailMutedParagraph(`Reference ID: ${escapeHtml(input.id)}`),
  ].join("\n");

  const html = wrapEmailHtml({
    title: `Partner inquiry: ${input.companyName}`,
    preheader: `New inquiry from ${input.companyName}`,
    bodyHtml,
  });

  return {
    subject: `Partner inquiry: ${input.companyName}`,
    text,
    html,
  };
}

export type FollowUpDigestItem = {
  companyName: string;
  dueDate: string;
  assigneeName: string | null;
  href: string;
};

export function followUpDigestEmail(
  memberName: string,
  items: FollowUpDigestItem[]
) {
  const lines = items.map(
    (item) =>
      `• ${item.companyName} — due ${item.dueDate}${item.assigneeName ? ` (assigned: ${item.assigneeName})` : ""}\n  ${appUrl()}${item.href}`
  );

  const text = [
    `Hi ${memberName},`,
    "",
    items.length === 1
      ? "One affiliate follow-up is due:"
      : `${items.length} affiliate follow-ups are due:`,
    "",
    ...lines,
    "",
    `Open CRM: ${appUrl()}/admin/affiliates`,
  ].join("\n");

  const listHtml = items
    .map(
      (item) =>
        `<li style="margin-bottom:12px;color:#ffffff;"><strong>${escapeHtml(item.companyName)}</strong> — due ${escapeHtml(item.dueDate)}${
          item.assigneeName
            ? ` <span style="color:#9a9a9a;">(assigned: ${escapeHtml(item.assigneeName)})</span>`
            : ""
        }<br /><a href="${appUrl()}${escapeHtml(item.href)}" style="color:#6db4e8;font-size:13px;">View in CRM</a></li>`
    )
    .join("");

  const bodyHtml = [
    emailParagraph(`Hi ${escapeHtml(memberName)},`),
    emailParagraph(
      items.length === 1
        ? "One affiliate follow-up is due:"
        : `${items.length} affiliate follow-ups are due:`
    ),
    `<ul style="margin:0 0 16px;padding-left:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;">${listHtml}</ul>`,
    emailButton(`${appUrl()}/admin/affiliates`, "Open affiliate CRM"),
  ].join("\n");

  const html = wrapEmailHtml({
    title: "Affiliate follow-ups due",
    preheader:
      items.length === 1
        ? `Follow-up due: ${items[0].companyName}`
        : `${items.length} affiliate follow-ups due`,
    bodyHtml,
  });

  return {
    subject:
      items.length === 1
        ? `Follow-up due: ${items[0].companyName}`
        : `${items.length} affiliate follow-ups due`,
    text,
    html,
  };
}

/** Sample branded email for manual / script testing. */
export function brandedEmailPreview() {
  const bodyHtml = [
    emailParagraph("Hi Tiago,"),
    emailParagraph(
      "This is a <strong style=\"color:#ffffff;\">design preview</strong> of TOOLQZ transactional emails — dark header, logo, and fixed colors that won&apos;t flip in dark mode."
    ),
    emailButton(appUrl(), "Visit TOOLQZ"),
    emailMutedParagraph("If the button doesn&apos;t work, copy this link: " + escapeHtml(appUrl())),
  ].join("\n");

  return {
    subject: "TOOLQZ — email design preview",
    text: [
      "Hi Tiago,",
      "",
      "This is a design preview of TOOLQZ transactional emails.",
      "",
      appUrl(),
    ].join("\n"),
    html: wrapEmailHtml({
      title: "TOOLQZ email preview",
      preheader: "Your new branded TOOLQZ email design",
      bodyHtml,
    }),
  };
}
