"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminAnalyticsOverview } from "@/components/admin/AdminAnalyticsOverview";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSiteTraffic } from "@/components/admin/AdminSiteTraffic";
import { AdminSocialFacebook } from "@/components/admin/AdminSocialFacebook";
import { AdminSocialInstagram } from "@/components/admin/AdminSocialInstagram";
import { applyAnalyticsUrlParams, type AnalyticsTab } from "@/lib/analytics-ranges";
import type { AnalyticsOverviewReport } from "@/lib/analytics-overview";
import { readAnalyticsTab, replaceAnalyticsUrl } from "@/lib/analytics-url-client";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "traffic", label: "Site traffic" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "clicks", label: "Outbound clicks" },
] as const;

export type AnalyticsHubTabId = (typeof TABS)[number]["id"];

const GA4_URL = "https://analytics.google.com/";
const INSTAGRAM_URL = "https://www.instagram.com/toolqz";
const FACEBOOK_URL = "https://www.facebook.com/toolqz";

const PREFETCH_URLS: Record<AnalyticsHubTabId, string> = {
  overview: "/api/admin/analytics/overview?range=30d",
  traffic: "/api/admin/site-analytics?range=30d",
  instagram: "/api/admin/social/instagram?range=30d",
  facebook: "/api/admin/social/facebook?range=30d",
  clicks: "/api/admin/analytics?range=30d",
};

function parseTab(tabParam: string | null): AnalyticsHubTabId {
  if (tabParam === "traffic") return "traffic";
  if (tabParam === "clicks") return "clicks";
  if (tabParam === "instagram") return "instagram";
  if (tabParam === "facebook") return "facebook";
  return "overview";
}

export function AdminAnalyticsHub({
  overviewInitial = null,
}: {
  overviewInitial?: AnalyticsOverviewReport | null;
}) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<AnalyticsHubTabId>(() =>
    parseTab(searchParams.get("tab"))
  );

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    const onPopState = () => setActiveTab(readAnalyticsTab());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setTab = useCallback(
    (tab: AnalyticsHubTabId) => {
      setActiveTab(tab);
      const range = searchParams.get("range") ?? undefined;
      replaceAnalyticsUrl(tab as AnalyticsTab, range);
    },
    [searchParams]
  );

  const prefetchTab = useCallback((tab: AnalyticsHubTabId) => {
    void fetch(PREFETCH_URLS[tab]).catch(() => {});
  }, []);

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
            onMouseEnter={() => prefetchTab(tab.id)}
            onFocus={() => prefetchTab(tab.id)}
            className={`admin-segmented-btn whitespace-nowrap ${
              activeTab === tab.id ? "admin-segmented-btn-active" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === "overview" ? undefined : "hidden"}>
        <AdminAnalyticsOverview
          active={activeTab === "overview"}
          initialData={overviewInitial}
          onNavigateTab={setTab}
        />
      </div>
      <div className={activeTab === "traffic" ? undefined : "hidden"}>
        <AdminSiteTraffic active={activeTab === "traffic"} />
      </div>
      <div className={activeTab === "instagram" ? undefined : "hidden"}>
        <AdminSocialInstagram active={activeTab === "instagram"} />
      </div>
      <div className={activeTab === "facebook" ? undefined : "hidden"}>
        <AdminSocialFacebook active={activeTab === "facebook"} />
      </div>
      <div className={activeTab === "clicks" ? undefined : "hidden"}>
        <AdminAnalytics active={activeTab === "clicks"} />
      </div>
    </div>
  );
}
