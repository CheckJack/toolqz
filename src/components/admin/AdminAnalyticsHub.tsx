"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminAnalyticsOverview } from "@/components/admin/AdminAnalyticsOverview";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSiteTraffic } from "@/components/admin/AdminSiteTraffic";
import { AdminSocialFacebook } from "@/components/admin/AdminSocialFacebook";
import { AdminSocialInstagram } from "@/components/admin/AdminSocialInstagram";
import { applyAnalyticsUrlParams, type AnalyticsTab } from "@/lib/analytics-ranges";
import type { AnalyticsOverviewReport } from "@/lib/analytics-overview";
import type { OutboundClickAnalytics } from "@/lib/analytics-clicks";
import type { FacebookDiagnostics, FacebookReport } from "@/lib/facebook-server";
import type { Ga4SiteReport } from "@/lib/ga4-server";
import type { InstagramDiagnostics, InstagramReport } from "@/lib/instagram-server";
import type { ToolCtrRow } from "@/lib/analytics-tool-ctr";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "traffic", label: "Site traffic" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "clicks", label: "Outbound clicks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const GA4_URL = "https://analytics.google.com/";
const INSTAGRAM_URL = "https://www.instagram.com/toolqz";
const FACEBOOK_URL = "https://www.facebook.com/toolqz";

function parseTab(tabParam: string | null): TabId {
  if (tabParam === "traffic") return "traffic";
  if (tabParam === "clicks") return "clicks";
  if (tabParam === "instagram") return "instagram";
  if (tabParam === "facebook") return "facebook";
  return "overview";
}

export function AdminAnalyticsHub({
  overviewInitial = null,
  trafficInitial = null,
  instagramInitial = null,
  instagramStatus = null,
  facebookInitial = null,
  facebookStatus = null,
  clicksInitial = null,
  toolCtrInitial = null,
}: {
  overviewInitial?: AnalyticsOverviewReport | null;
  trafficInitial?: Ga4SiteReport | null;
  instagramInitial?: InstagramReport | null;
  instagramStatus?: InstagramDiagnostics | null;
  facebookInitial?: FacebookReport | null;
  facebookStatus?: FacebookDiagnostics | null;
  clicksInitial?: OutboundClickAnalytics | null;
  toolCtrInitial?: { configured: boolean; rows: ToolCtrRow[]; warning: string | null } | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    applyAnalyticsUrlParams(params, tab as AnalyticsTab, params.get("range") ?? undefined);
    router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
  }

  const description =
    activeTab === "overview"
      ? "Cross-channel snapshot — site, social, clicks, and newsletter"
      : activeTab === "traffic"
        ? "Visitors and page views from Google Analytics 4"
        : activeTab === "instagram"
          ? "Posts, followers, and reach from @toolqz on Instagram"
          : activeTab === "facebook"
            ? "Page insights and posts from Toolqz on Facebook"
            : "Outbound Visit link clicks, CTR, and affiliate conversions";

  const headerAction =
    activeTab === "traffic" ? (
      <Link href={GA4_URL} target="_blank" rel="noopener noreferrer" className="admin-toolbar-btn">
        Open GA4
      </Link>
    ) : activeTab === "instagram" ? (
      <Link
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="admin-toolbar-btn"
      >
        Open Instagram
      </Link>
    ) : activeTab === "facebook" ? (
      <Link
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="admin-toolbar-btn"
      >
        Open Facebook
      </Link>
    ) : undefined;

  return (
    <div className="space-y-6">
      <AdminPageHeader hideTitle title="Analytics" description={description} action={headerAction} />

      <div className="admin-segmented w-fit max-w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`admin-segmented-btn whitespace-nowrap ${
              activeTab === tab.id ? "admin-segmented-btn-active" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <AdminAnalyticsOverview initialData={overviewInitial} />
      ) : activeTab === "traffic" ? (
        <AdminSiteTraffic
          key={`traffic-${searchParams.get("range") ?? "30d"}`}
          initialData={trafficInitial}
        />
      ) : activeTab === "instagram" ? (
        <AdminSocialInstagram
          key={`instagram-${searchParams.get("range") ?? "30d"}`}
          initialData={instagramInitial}
          initialStatus={instagramStatus}
        />
      ) : activeTab === "facebook" ? (
        <AdminSocialFacebook
          key={`facebook-${searchParams.get("range") ?? "30d"}`}
          initialData={facebookInitial}
          initialStatus={facebookStatus}
        />
      ) : (
        <AdminAnalytics
          key={`clicks-${searchParams.get("range") ?? "30d"}`}
          initialData={clicksInitial}
          toolCtrInitial={toolCtrInitial}
        />
      )}
    </div>
  );
}
