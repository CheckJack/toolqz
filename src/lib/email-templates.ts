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

export type TaskDigestItem = {
  title: string;
  section: string;
  status: string;
  priority: string;
  dueLabel: string | null;
  href: string | null;
  overdue: boolean;
};

export function buildStatusEmail(input: {
  name: string;
  domain: string;
  status: "running" | "completed" | "failed";
  buildId: string;
  createdAt?: string;
}) {
  const hostingUrl = `${appUrl()}/admin/hosting`;
  const statusLabel =
    input.status === "running"
      ? "Build started"
      : input.status === "completed"
        ? "Build completed successfully"
        : "Build failed";

  const subject =
    input.status === "running"
      ? `TOOLQZ deploy started — ${input.domain}`
      : input.status === "completed"
        ? `TOOLQZ deploy succeeded — ${input.domain}`
        : `TOOLQZ deploy failed — ${input.domain}`;

  const text = [
    `Hi ${input.name},`,
    "",
    statusLabel,
    `Domain: ${input.domain}`,
    `Build ID: ${input.buildId}`,
    input.createdAt ? `Started: ${input.createdAt}` : "",
    "",
    `View deploy history: ${hostingUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const bodyHtml = [
    emailParagraph(`Hi ${escapeHtml(input.name)},`),
    emailParagraph(
      `<strong style="color:#ffffff;">${escapeHtml(statusLabel)}</strong> for <strong style="color:#ffffff;">${escapeHtml(input.domain)}</strong>.`
    ),
    emailMutedParagraph(`Build ID: ${escapeHtml(input.buildId)}`),
    input.createdAt
      ? emailMutedParagraph(`Started: ${escapeHtml(input.createdAt)}`)
      : "",
    emailButton(hostingUrl, "View deploy history"),
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapEmailHtml({
    title: statusLabel,
    preheader: `${statusLabel} — ${input.domain}`,
    bodyHtml,
  });

  return { subject, text, html };
}

export function taskDigestEmail(name: string, items: TaskDigestItem[]) {
  const tasksUrl = `${appUrl()}/admin/tasks`;
  const lines = items.map((item) => {
    const due = item.dueLabel ? ` — due ${item.dueLabel}` : "";
    const overdue = item.overdue ? " (overdue)" : "";
    const link = item.href ? `\n  ${appUrl()}${item.href}` : "";
    return `• [${item.priority}] ${item.title} (${item.section}, ${item.status})${due}${overdue}${link}`;
  });

  const text = [
    `Hi ${name},`,
    "",
    items.length === 0
      ? "You have no open tasks today. Nice work!"
      : items.length === 1
        ? "You have 1 open task:"
        : `You have ${items.length} open tasks:`,
    "",
    ...lines,
    "",
    `Open tasks: ${tasksUrl}`,
  ].join("\n");

  const listHtml =
    items.length === 0
      ? emailParagraph("You have no open tasks today. Nice work!")
      : `<ul style="margin:0 0 16px;padding-left:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;">${items
          .map((item) => {
            const due = item.dueLabel
              ? ` — due ${escapeHtml(item.dueLabel)}${item.overdue ? " <span style=\"color:#f87171;\">(overdue)</span>" : ""}`
              : "";
            const link = item.href
              ? `<br /><a href="${appUrl()}${escapeHtml(item.href)}" style="color:#6db4e8;font-size:13px;">Open task</a>`
              : "";
            return `<li style="margin-bottom:12px;color:#ffffff;"><strong>${escapeHtml(item.title)}</strong> <span style="color:#9a9a9a;">(${escapeHtml(item.section)} · ${escapeHtml(item.status)} · ${escapeHtml(item.priority)})</span>${due}${link}</li>`;
          })
          .join("")}</ul>`;

  const bodyHtml = [
    emailParagraph(`Hi ${escapeHtml(name)},`),
    emailParagraph(
      items.length === 0
        ? "Here&apos;s your daily task summary."
        : items.length === 1
          ? "You have <strong style=\"color:#ffffff;\">1 open task</strong> today:"
          : `You have <strong style="color:#ffffff;">${items.length} open tasks</strong> today:`
    ),
    listHtml,
    emailButton(tasksUrl, "Open tasks board"),
  ].join("\n");

  const html = wrapEmailHtml({
    title: "Your daily tasks",
    preheader:
      items.length === 0
        ? "No open tasks today"
        : items.length === 1
          ? "1 open task today"
          : `${items.length} open tasks today`,
    bodyHtml,
  });

  return {
    subject:
      items.length === 0
        ? "TOOLQZ — no open tasks today"
        : items.length === 1
          ? "TOOLQZ — 1 task for today"
          : `TOOLQZ — ${items.length} tasks for today`,
    text,
    html,
  };
}

export function teamMessageEmail(input: {
  recipientName: string;
  senderName: string;
  preview: string;
}) {
  const messagesUrl = `${appUrl()}/admin/messages`;
  const preview =
    input.preview.length > 280 ? `${input.preview.slice(0, 277)}…` : input.preview;

  const text = [
    `Hi ${input.recipientName},`,
    "",
    `${input.senderName} sent you a message on TOOLQZ:`,
    "",
    preview,
    "",
    `Read it: ${messagesUrl}`,
  ].join("\n");

  const bodyHtml = [
    emailParagraph(`Hi ${escapeHtml(input.recipientName)},`),
    emailParagraph(
      `<strong style="color:#ffffff;">${escapeHtml(input.senderName)}</strong> sent you a message on TOOLQZ:`
    ),
    `<p style="margin:0 0 16px;padding:12px 14px;border-radius:8px;background:#252525;border:1px solid #3d3d3d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#e5e5e5;">${escapeHtml(preview).replace(/\n/g, "<br />")}</p>`,
    emailButton(messagesUrl, "Read message"),
  ].join("\n");

  const html = wrapEmailHtml({
    title: "New team message",
    preheader: `${input.senderName}: ${preview.slice(0, 80)}`,
    bodyHtml,
  });

  return {
    subject: `New message from ${input.senderName}`,
    text,
    html,
  };
}

export function siteStatusEmail(input: {
  name: string;
  domain: string;
  healthy: boolean;
  statusCode: number;
  detail?: string;
}) {
  const subject = input.healthy
    ? `TOOLQZ is back online — ${input.domain}`
    : `TOOLQZ may be down — ${input.domain}`;

  const headline = input.healthy ? "Website recovered" : "Website health alert";
  const text = [
    `Hi ${input.name},`,
    "",
    headline,
    `Domain: ${input.domain}`,
    `HTTP status: ${input.statusCode || "unreachable"}`,
    input.detail ? `Detail: ${input.detail}` : "",
    "",
    `Check hosting: ${appUrl()}/admin/hosting`,
    `Health endpoint: ${appUrl()}/api/health`,
  ]
    .filter(Boolean)
    .join("\n");

  const bodyHtml = [
    emailParagraph(`Hi ${escapeHtml(input.name)},`),
    emailParagraph(
      input.healthy
        ? `<strong style="color:#ffffff;">${escapeHtml(input.domain)}</strong> is responding normally again.`
        : `<strong style="color:#ffffff;">${escapeHtml(input.domain)}</strong> may be down or unhealthy. We couldn&apos;t get a healthy response.`
    ),
    emailMutedParagraph(`HTTP status: ${input.statusCode || "unreachable"}`),
    input.detail ? emailMutedParagraph(escapeHtml(input.detail)) : "",
    emailButton(`${appUrl()}/admin/hosting`, "Open hosting dashboard"),
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapEmailHtml({
    title: headline,
    preheader: subject,
    bodyHtml,
  });

  return { subject, text, html };
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
