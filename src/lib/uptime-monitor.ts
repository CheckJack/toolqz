import { getDeploymentIssues } from "@/lib/env";
import { siteStatusEmail } from "@/lib/email-templates";
import { getHostingerDomain, pingPublicSite } from "@/lib/hostinger-api";
import { notifySiteStatus } from "@/lib/notifications";
import {
  getAdminAlertRecipients,
  getMonitorState,
  sendAlertEmails,
  setMonitorState,
} from "@/lib/platform-alerts";
import { prisma } from "@/lib/db";

const STATE_KEY = "last_site_healthy";

async function checkSiteHealthy(): Promise<{
  healthy: boolean;
  statusCode: number;
  detail?: string;
}> {
  const ping = await pingPublicSite();
  if (!ping.ok) {
    return {
      healthy: false,
      statusCode: ping.status,
      detail: ping.status === 0 ? "Site unreachable" : `Homepage returned HTTP ${ping.status}`,
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check failed";
    return { healthy: false, statusCode: ping.status, detail: message };
  }

  const issues = getDeploymentIssues();
  if (issues.length > 0) {
    return {
      healthy: false,
      statusCode: ping.status,
      detail: issues.join("; "),
    };
  }

  return { healthy: true, statusCode: ping.status };
}

export async function runUptimeCheck(options?: { force?: boolean }) {
  const result = await checkSiteHealthy();
  const prevRaw = await getMonitorState(STATE_KEY);
  const prevHealthy = prevRaw === null ? true : prevRaw === "true";

  let emailsSent = 0;
  let notificationsCreated = 0;
  let alerted = false;

  if (options?.force) {
    const recipients = await getAdminAlertRecipients();
    const domain = getHostingerDomain();
    for (const user of recipients) {
      const mail = siteStatusEmail({
        name: user.name,
        domain,
        healthy: result.healthy,
        statusCode: result.statusCode,
        detail: result.detail,
      });
      emailsSent += await sendAlertEmails([user], mail);
    }
    notificationsCreated = await notifySiteStatus({
      healthy: result.healthy,
      domain,
      statusCode: result.statusCode,
      detail: result.detail ?? null,
    });
    alerted = notificationsCreated > 0;

    return {
      ok: true,
      healthy: result.healthy,
      statusCode: result.statusCode,
      detail: result.detail ?? null,
      transitioned: false,
      forced: true,
      alerted,
      emailsSent,
      notificationsCreated,
    };
  }

  if (result.healthy !== prevHealthy) {
    const recipients = await getAdminAlertRecipients();
    const domain = getHostingerDomain();
    for (const user of recipients) {
      const mail = siteStatusEmail({
        name: user.name,
        domain,
        healthy: result.healthy,
        statusCode: result.statusCode,
        detail: result.detail,
      });
      emailsSent += await sendAlertEmails([user], mail);
    }
    notificationsCreated = await notifySiteStatus({
      healthy: result.healthy,
      domain,
      statusCode: result.statusCode,
      detail: result.detail ?? null,
    });
    alerted = true;
  }

  await setMonitorState(STATE_KEY, result.healthy ? "true" : "false");

  return {
    ok: true,
    healthy: result.healthy,
    statusCode: result.statusCode,
    detail: result.detail ?? null,
    transitioned: result.healthy !== prevHealthy,
    alerted,
    emailsSent,
    notificationsCreated,
  };
}
