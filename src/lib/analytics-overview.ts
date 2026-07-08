import { fetchOutboundClickAnalytics } from "@/lib/analytics-clicks";
import { fetchNewsletterTrend } from "@/lib/analytics-newsletter";
import { parseSocialRange, type SocialRange } from "@/lib/analytics-ranges";
import { getRecentSnapshots } from "@/lib/analytics-snapshot";
import { fetchFacebookReport, getFacebookDiagnostics } from "@/lib/facebook-server";
import { fetchGa4OverviewLite, getGa4Diagnostics } from "@/lib/ga4-server";
import { fetchInstagramReport, getInstagramDiagnostics } from "@/lib/instagram-server";

export interface AnalyticsOverviewReport {
  range: SocialRange;
  fetchedAt: string;
  health: {
    ga4: { ready: boolean; hint: string | null };
    instagram: { ready: boolean; hint: string | null };
    facebook: { ready: boolean; hint: string | null };
    metaToken: { valid: boolean; warning: string | null; daysUntilExpiry: number | null };
  };
  site: {
    configured: boolean;
    users: number;
    pageViews: number;
    sessions: number;
    usersChangePct: number | null;
    pageViewsChangePct: number | null;
    blogPageViews: number;
    realtimeActiveUsers: number;
    warnings: string[];
  } | null;
  clicks: {
    rangeClicks: number;
    todayClicks: number;
    conversionRevenue: number;
    conversionCount: number;
  };
  instagram: {
    configured: boolean;
    followersCount: number;
    totalReach: number;
    profileViews: number | null;
    warnings: string[];
  } | null;
  facebook: {
    configured: boolean;
    followersCount: number;
    totalReach: number;
    totalEngagement: number;
    warnings: string[];
  } | null;
  newsletter: {
    totalActive: number;
    newInRange: number;
  };
  trends: {
    siteDaily: { date: string; users: number; pageViews: number }[];
    clicksDaily: { date: string; count: number }[];
    newsletterDaily: { date: string; count: number }[];
  };
  snapshots: Awaited<ReturnType<typeof getRecentSnapshots>>;
  warnings: string[];
}

export async function fetchAnalyticsOverview(
  rangeInput?: string
): Promise<AnalyticsOverviewReport> {
  const range = parseSocialRange(rangeInput);
  const clickRange = range === "90d" ? "90d" : range;
  const warnings: string[] = [];

  const [ga4Diag, igDiag, fbDiag, clicks, newsletter, snapshots, ga4Lite, igReport, fbReport] =
    await Promise.all([
      Promise.resolve(getGa4Diagnostics()),
      getInstagramDiagnostics(),
      getFacebookDiagnostics(),
      fetchOutboundClickAnalytics(clickRange),
      fetchNewsletterTrend(range),
      getRecentSnapshots(14),
      fetchGa4OverviewLite(clickRange).catch(() => null),
      fetchInstagramReport(range).catch((error: unknown) => {
        warnings.push(error instanceof Error ? error.message : "Instagram overview failed");
        return null;
      }),
      fetchFacebookReport(range).catch((error: unknown) => {
        warnings.push(error instanceof Error ? error.message : "Facebook overview failed");
        return null;
      }),
    ]);

  let site: AnalyticsOverviewReport["site"] = null;
  if (ga4Lite) {
    site = {
      configured: true,
      users: ga4Lite.users,
      pageViews: ga4Lite.pageViews,
      sessions: ga4Lite.sessions,
      usersChangePct: ga4Lite.usersChangePct,
      pageViewsChangePct: ga4Lite.pageViewsChangePct,
      blogPageViews: ga4Lite.blogPageViews,
      realtimeActiveUsers: ga4Lite.realtimeActiveUsers,
      warnings: ga4Lite.warnings,
    };
    warnings.push(...ga4Lite.warnings);
  }

  let instagram: AnalyticsOverviewReport["instagram"] = null;
  if (igReport?.configured) {
    instagram = {
      configured: true,
      followersCount: igReport.followersCount,
      totalReach: igReport.totalReach,
      profileViews: igReport.profileViews,
      warnings: igReport.warnings,
    };
    warnings.push(...igReport.warnings);
  }

  let facebook: AnalyticsOverviewReport["facebook"] = null;
  if (fbReport?.configured) {
    facebook = {
      configured: true,
      followersCount: fbReport.followersCount,
      totalReach: fbReport.totalReach,
      totalEngagement: fbReport.totalEngagement,
      warnings: fbReport.warnings,
    };
    warnings.push(...fbReport.warnings);
  }

  const tokenHealth = igDiag.tokenHealth ?? fbDiag.tokenHealth;

  return {
    range,
    fetchedAt: new Date().toISOString(),
    health: {
      ga4: { ready: ga4Diag.ready, hint: ga4Diag.hint },
      instagram: { ready: igDiag.ready, hint: igDiag.hint },
      facebook: { ready: fbDiag.ready, hint: fbDiag.hint },
      metaToken: {
        valid: tokenHealth?.valid ?? false,
        warning: tokenHealth?.warning ?? null,
        daysUntilExpiry: tokenHealth?.daysUntilExpiry ?? null,
      },
    },
    site,
    clicks: {
      rangeClicks: clicks.rangeClicks,
      todayClicks: clicks.todayClicks,
      conversionRevenue: clicks.conversionRevenue,
      conversionCount: clicks.conversionCount,
    },
    instagram,
    facebook,
    newsletter: {
      totalActive: newsletter.totalActive,
      newInRange: newsletter.newInRange,
    },
    trends: {
      siteDaily: ga4Lite?.daily ?? [],
      clicksDaily: clicks.dailyClicks,
      newsletterDaily: newsletter.daily,
    },
    snapshots,
    warnings: [...new Set(warnings.filter(Boolean))],
  };
}
