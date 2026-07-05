"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSiteTraffic } from "@/components/admin/AdminSiteTraffic";

const TABS = [
  { id: "traffic", label: "Site traffic" },
  { id: "clicks", label: "Outbound clicks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const GA4_URL = "https://analytics.google.com/";

export function AdminAnalyticsHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = tabParam === "clicks" ? "clicks" : "traffic";

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "traffic") params.delete("tab");
    else params.set("tab", tab);
    router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
  }

  const description =
    activeTab === "traffic"
      ? "Visitors and page views from Google Analytics 4"
      : "Outbound Visit link clicks across your tools";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        hideTitle
        title="Analytics"
        description={description}
        action={
          activeTab === "traffic" ? (
            <Link
              href={GA4_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-toolbar-btn"
            >
              Open GA4
            </Link>
          ) : undefined
        }
      />

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

      {activeTab === "traffic" ? <AdminSiteTraffic /> : <AdminAnalytics />}
    </div>
  );
}
