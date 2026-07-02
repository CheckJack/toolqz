const appUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://toolqz.com").replace(/\/$/, "");

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

  const html = `
    <p>${greeting}</p>
    <p>Thanks for subscribing to <strong>TOOLQZ</strong> — you'll get our best tool picks, reviews, and updates in your inbox.</p>
    <p>We only send what we'd actually read ourselves. No spam.</p>
    <p><a href="${appUrl()}">Browse the directory</a></p>
    <p>— The TOOLQZ team</p>
  `.trim();

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

  const html = `
    <p><strong>New work-with-us inquiry</strong> (${input.id})</p>
    <ul>
      <li><strong>Company:</strong> ${escapeHtml(input.companyName)}</li>
      <li><strong>Contact:</strong> ${escapeHtml(input.contactName)}</li>
      <li><strong>Email:</strong> <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></li>
      <li><strong>Website:</strong> ${input.website ? `<a href="${escapeHtml(input.website)}">${escapeHtml(input.website)}</a>` : "—"}</li>
      <li><strong>Type:</strong> ${escapeHtml(input.productLabel)}</li>
    </ul>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
  `.trim();

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
        `<li><strong>${escapeHtml(item.companyName)}</strong> — due ${escapeHtml(item.dueDate)}${
          item.assigneeName
            ? ` <span style="color:#888">(assigned: ${escapeHtml(item.assigneeName)})</span>`
            : ""
        }<br /><a href="${appUrl()}${escapeHtml(item.href)}">View in CRM</a></li>`
    )
    .join("");

  const html = `
    <p>Hi ${escapeHtml(memberName)},</p>
    <p>${
      items.length === 1
        ? "One affiliate follow-up is due:"
        : `${items.length} affiliate follow-ups are due:`
    }</p>
    <ul>${listHtml}</ul>
    <p><a href="${appUrl()}/admin/affiliates">Open affiliate CRM</a></p>
  `.trim();

  return {
    subject:
      items.length === 1
        ? `Follow-up due: ${items[0].companyName}`
        : `${items.length} affiliate follow-ups due`,
    text,
    html,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
