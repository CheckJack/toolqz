import { prisma } from "@/lib/db";

export async function getMonitorState(key: string): Promise<string | null> {
  const row = await prisma.systemMonitorState.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setMonitorState(key: string, value: string): Promise<void> {
  await prisma.systemMonitorState.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getTeamBuildAlertRecipients(): Promise<{ email: string; name: string }[]> {
  return prisma.user.findMany({
    where: { emailBuildAlerts: true },
    select: { email: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** @deprecated use getTeamBuildAlertRecipients */
export async function getAdminAlertRecipients(): Promise<{ email: string; name: string }[]> {
  return getTeamBuildAlertRecipients();
}

export async function sendAlertEmails(
  recipients: { email: string; name: string }[],
  mail: { subject: string; text: string; html: string }
): Promise<number> {
  const { sendEmail } = await import("@/lib/email");
  let sent = 0;
  for (const user of recipients) {
    try {
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      sent++;
    } catch (error) {
      console.error(`[alerts] email failed for ${user.email}:`, error);
    }
  }
  return sent;
}
