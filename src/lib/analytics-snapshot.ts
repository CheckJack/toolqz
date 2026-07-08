import { fetchAnalyticsOverview } from "@/lib/analytics-overview";
import { prisma } from "@/lib/db";

export interface SnapshotPayload {
  siteUsers: number | null;
  sitePageViews: number | null;
  outboundClicks: number;
  instagramFollowers: number | null;
  instagramReach: number | null;
  facebookFollowers: number | null;
  facebookReach: number | null;
  newsletterActive: number;
}

export async function saveDailyAnalyticsSnapshot(): Promise<{ date: string; saved: boolean }> {
  const overview = await fetchAnalyticsOverview("30d");
  const date = new Date().toISOString().slice(0, 10);

  const payload: SnapshotPayload = {
    siteUsers: overview.site?.users ?? null,
    sitePageViews: overview.site?.pageViews ?? null,
    outboundClicks: overview.clicks.rangeClicks,
    instagramFollowers: overview.instagram?.followersCount ?? null,
    instagramReach: overview.instagram?.totalReach ?? null,
    facebookFollowers: overview.facebook?.followersCount ?? null,
    facebookReach: overview.facebook?.totalReach ?? null,
    newsletterActive: overview.newsletter.totalActive,
  };

  await prisma.analyticsSnapshot.upsert({
    where: { date },
    create: { date, payload: JSON.stringify(payload) },
    update: { payload: JSON.stringify(payload) },
  });

  return { date, saved: true };
}

export async function getRecentSnapshots(limit = 14) {
  let rows: { date: string; payload: string }[] = [];
  try {
    rows = await prisma.analyticsSnapshot.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });
  } catch (error) {
    console.warn("[analytics-snapshot] Could not load snapshots:", error);
    return [];
  }

  return rows
    .map((row) => {
      try {
        return {
          date: row.date,
          payload: JSON.parse(row.payload) as SnapshotPayload,
        };
      } catch {
        return null;
      }
    })
    .filter((row): row is { date: string; payload: SnapshotPayload } => row !== null)
    .reverse();
}
