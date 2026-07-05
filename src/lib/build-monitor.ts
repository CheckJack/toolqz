import { buildStatusEmail } from "@/lib/email-templates";
import { getHostingerDomain, isHostingerConfigured, listBuilds } from "@/lib/hostinger-api";
import {
  getAdminAlertRecipients,
  getMonitorState,
  sendAlertEmails,
  setMonitorState,
} from "@/lib/platform-alerts";

const STATE_KEY = "last_build_snapshot";

type BuildSnapshot = {
  uuid: string;
  status: string;
  notifiedRunning: boolean;
  notifiedFinal: boolean;
};

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function isRunning(status: string): boolean {
  const s = normalizeStatus(status);
  return s === "running" || s === "pending" || s === "in_progress";
}

function isCompleted(status: string): boolean {
  return normalizeStatus(status) === "completed";
}

function isFailed(status: string): boolean {
  const s = normalizeStatus(status);
  return s === "failed" || s === "error" || s === "cancelled";
}

function isFinal(status: string): boolean {
  return isCompleted(status) || isFailed(status);
}

async function readSnapshot(): Promise<BuildSnapshot | null> {
  const raw = await getMonitorState(STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BuildSnapshot;
  } catch {
    return null;
  }
}

async function writeSnapshot(snapshot: BuildSnapshot): Promise<void> {
  await setMonitorState(STATE_KEY, JSON.stringify(snapshot));
}

export async function runBuildMonitor() {
  if (!isHostingerConfigured()) {
    return { ok: true, skipped: true, reason: "hostinger_not_configured", emailsSent: 0 };
  }

  const domain = getHostingerDomain();
  const builds = await listBuilds(domain, 5);
  const latest = builds[0];
  if (!latest) {
    return { ok: true, skipped: true, reason: "no_builds", emailsSent: 0 };
  }

  const prev = await readSnapshot();
  let snapshot: BuildSnapshot = prev ?? {
    uuid: latest.uuid,
    status: latest.status,
    notifiedRunning: false,
    notifiedFinal: false,
  };

  let emailsSent = 0;
  const recipients = await getAdminAlertRecipients();
  const createdAt = latest.createdAt
    ? new Date(latest.createdAt).toLocaleString("en-GB", { timeZone: "Europe/Lisbon" })
    : undefined;

  async function notify(
    status: "running" | "completed" | "failed"
  ) {
    for (const user of recipients) {
      const mail = buildStatusEmail({
        name: user.name,
        domain,
        status,
        buildId: latest.uuid,
        createdAt,
      });
      emailsSent += await sendAlertEmails([user], mail);
    }
  }

  if (prev?.uuid !== latest.uuid) {
    snapshot = {
      uuid: latest.uuid,
      status: latest.status,
      notifiedRunning: false,
      notifiedFinal: false,
    };
  } else {
    snapshot.status = latest.status;
  }

  if (isRunning(latest.status) && !snapshot.notifiedRunning) {
    await notify("running");
    snapshot.notifiedRunning = true;
  }

  if (isFinal(latest.status) && !snapshot.notifiedFinal) {
    await notify(isCompleted(latest.status) ? "completed" : "failed");
    snapshot.notifiedFinal = true;
  }

  await writeSnapshot(snapshot);

  return {
    ok: true,
    skipped: false,
    buildId: latest.uuid,
    status: latest.status,
    emailsSent,
    recipients: recipients.length,
  };
}
