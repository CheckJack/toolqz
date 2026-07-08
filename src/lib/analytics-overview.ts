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
  snapshots: Awaited<ReturnType<typeof getRecentSnapshots>>;
  warnings: string[];
}

export async function fetchAnalyticsOverview(
  rangeInput?: string
): Promise<AnalyticsOverviewReport> {
  const range = parseSocialRange(rangeInput);
  const warnings: string[] = [];

  const [ga4Diag, igDiag, fbDiag, clicks, newsletter, snapshots] = await Promise.all([
    Promise.resolve(getGa4Diagnostics()),
    getInstagramDiagnostics(),
    getFacebookDiagnostics(),
    fetchOutboundClickAnalytics(range === "90d" ? "90d" : range),
    fetchNewsletterTrend(range),
    getRecentSnapshots(14),
  ]);

  let site: AnalyticsOverviewReport["site"] = null;
  try {
    const lite = await fetchGa4OverviewLite(range === "90d" ? "90d" : range);
    if (lite) {
      site = {
        configured: true,
        users: lite.users,
        pageViews: lite.pageViews,
        sessions: lite.sessions,
        usersChangePct: lite.usersChangePct,
        pageViewsChangePct: lite.pageViewsChangePct,
        blogPageViews: lite.blogPageViews,
        realtimeActiveUsers: lite.realtimeActiveUsers,
        warnings: lite.warnings,
      };
      warnings.push(...lite.warnings);
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "GA4 overview failed");
  }

  let instagram: AnalyticsOverviewReport["instagram"] = null;
  try {
    const report = await fetchInstagramReport(range);
    if (report.configured) {
      instagram = {
        configured: true,
        followersCount: report.followersCount,
        totalReach: report.totalReach,
        profileViews: report.profileViews,
        warnings: report.warnings,
      };
      warnings.push(...report.warnings);
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Instagram overview failed");
  }

  let facebook: AnalyticsOverviewReport["facebook"] = null;
  try {
    const report = await fetchFacebookReport(range);
    if (report.configured) {
      facebook = {
        configured: true,
        followersCount: report.followersCount,
        totalReach: report.totalReach,
        totalEngagement: report.totalEngagement,
        warnings: report.warnings,
      };
      warnings.push(...report.warnings);
    }
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Facebook overview failed");
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
    snapshots,
    warnings: [...new Set(warnings.filter(Boolean))],
  };
}
