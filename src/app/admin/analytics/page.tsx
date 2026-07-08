import { Suspense } from "react";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAnalyticsHub } from "@/components/admin/AdminAnalyticsHub";
import { getSession } from "@/lib/auth";
import { fetchAnalyticsOverview } from "@/lib/analytics-overview";
import { fetchOutboundClickAnalytics } from "@/lib/analytics-clicks";
import { fetchToolCtrReport } from "@/lib/analytics-tool-ctr";
import {
  parseClickRange,
  parseSocialRange,
  parseTrafficRange,
} from "@/lib/analytics-ranges";
import { fetchFacebookReport, getFacebookDiagnostics } from "@/lib/facebook-server";
import { fetchGa4SiteReport, getGa4Diagnostics } from "@/lib/ga4-server";
import { fetchInstagramReport, getInstagramDiagnostics } from "@/lib/instagram-server";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  const params = await searchParams;
  const tab = params.tab ?? "overview";
  const socialRange = parseSocialRange(params.range);
  const trafficRange = parseTrafficRange(params.range);
  const clickRange = parseClickRange(params.range);

  const [instagramStatus, facebookStatus] = await Promise.all([
    getInstagramDiagnostics(),
    getFacebookDiagnostics(),
  ]);

  let overviewInitial = null;
  let trafficInitial = null;
  let instagramInitial = null;
  let facebookInitial = null;
  let clicksInitial = null;
  let toolCtrInitial = null;

  if (tab === "overview" || !params.tab) {
    try {
      overviewInitial = await fetchAnalyticsOverview(params.range);
    } catch {
      overviewInitial = null;
    }
  }

  if (tab === "traffic") {
    try {
      if (getGa4Diagnostics().ready) {
        trafficInitial = await fetchGa4SiteReport(trafficRange);
      }
    } catch {
      trafficInitial = null;
    }
  }

  if (tab === "instagram") {
    try {
      instagramInitial = await fetchInstagramReport(socialRange);
    } catch {
      instagramInitial = null;
    }
  }

  if (tab === "facebook") {
    try {
      facebookInitial = await fetchFacebookReport(socialRange);
    } catch {
      facebookInitial = null;
    }
  }

  if (tab === "clicks") {
    try {
      clicksInitial = await fetchOutboundClickAnalytics(clickRange);
      toolCtrInitial = await fetchToolCtrReport(trafficRange, clickRange);
    } catch {
      clicksInitial = null;
      toolCtrInitial = null;
    }
  }

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading analytics...</p>}>
        <AdminAnalyticsHub
          overviewInitial={overviewInitial}
          trafficInitial={trafficInitial}
          instagramInitial={instagramInitial}
          instagramStatus={instagramStatus}
          facebookInitial={facebookInitial}
          facebookStatus={facebookStatus}
          clicksInitial={clicksInitial}
          toolCtrInitial={toolCtrInitial}
        />
      </Suspense>
    </AdminShell>
  );
}
