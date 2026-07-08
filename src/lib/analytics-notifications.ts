import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { AnalyticsOverviewReport } from "@/lib/analytics-overview";
import { notifyTeamMembers } from "@/lib/notifications";

const DEDUPE_MS = 24 * 60 * 60 * 1000;

export type AnalyticsWarningSource = "overview" | "traffic" | "instagram" | "facebook";

const HREF_BY_SOURCE: Record<AnalyticsWarningSource, string> = {
  overview: "/admin/analytics",
  traffic: "/admin/analytics?tab=traffic",
  instagram: "/admin/analytics?tab=instagram",
  facebook: "/admin/analytics?tab=facebook",
};

function warningEntityId(source: AnalyticsWarningSource, message: string): string {
  const hash = createHash("sha256").update(`${source}:${message}`).digest("hex").slice(0, 24);
  return `analytics:${source}:${hash}`;
}

export function collectOverviewWarnings(report: AnalyticsOverviewReport): string[] {
  const items = [...report.warnings];

  if (!report.health.ga4.ready && report.health.ga4.hint) {
    items.push(report.health.ga4.hint);
  }
  if (!report.health.instagram.ready && report.health.instagram.hint) {
    items.push(report.health.instagram.hint);
  }
  if (!report.health.facebook.ready && report.health.facebook.hint) {
    items.push(report.health.facebook.hint);
  }
  if (report.health.metaToken.warning) {
    items.push(report.health.metaToken.warning);
  }

  return [...new Set(items.filter(Boolean))];
}

/** Create in-app notifications for all team members; dedupe per warning within 24h. */
export async function notifyAnalyticsWarnings(
  warnings: string[],
  source: AnalyticsWarningSource
): Promise<number> {
  try {
    const unique = [...new Set(warnings.map((w) => w.trim()).filter(Boolean))];
    if (!unique.length) return 0;

    const since = new Date(Date.now() - DEDUPE_MS);
    let created = 0;

    for (const warning of unique) {
      const entityId = warningEntityId(source, warning);
      const existing = await prisma.adminNotification.findFirst({
        where: {
          type: "analytics_warning",
          entityId,
          createdAt: { gte: since },
        },
        select: { id: true },
      });
      if (existing) continue;

      created += await notifyTeamMembers({
        type: "analytics_warning",
        title: "Analytics warning",
        body: warning,
        href: HREF_BY_SOURCE[source],
        entityId,
      });
    }

    return created;
  } catch (error) {
    console.error("[analytics-notifications] Failed to notify:", error);
    return 0;
  }
}
