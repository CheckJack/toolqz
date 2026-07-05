import { teamMessageEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/db";

export async function notifyTeamMessage(input: {
  recipientId: string;
  senderName: string;
  body: string;
  conversationId: string;
}) {
  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientId },
    select: { id: true, email: true, name: true, emailMessageAlerts: true },
  });

  if (!recipient?.emailMessageAlerts) return { notified: false };

  const preview = input.body.trim();

  await createNotification({
    userId: recipient.id,
    type: "team_message",
    title: `New message from ${input.senderName}`,
    body: preview.slice(0, 120),
    href: "/admin/messages",
    entityId: input.conversationId,
  });

  const mail = teamMessageEmail({
    recipientName: recipient.name,
    senderName: input.senderName,
    preview,
  });

  try {
    await sendEmail({
      to: recipient.email,
      toName: recipient.name,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { notified: true };
  } catch (error) {
    console.error(`[team-message] email failed for ${recipient.email}:`, error);
    return { notified: false };
  }
}
