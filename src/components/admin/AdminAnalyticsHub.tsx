"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminSiteTraffic } from "@/components/admin/AdminSiteTraffic";

const TABS = [
  { id: "traffic", label: "Site traffic" },
  { id: "clicks", label: "Outbound clicks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-dark-border pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-neon/15 text-neon"
                : "text-muted hover:bg-dark-elevated hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <Link
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-sm text-muted hover:text-neon"
        >
          GA4 dashboard →
        </Link>
      </div>

      {activeTab === "traffic" ? <AdminSiteTraffic /> : <AdminAnalytics />}
    </div>
  );
}
