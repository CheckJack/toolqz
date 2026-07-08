"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSiteTraffic } from "@/components/admin/AdminSiteTraffic";
import { AdminSocialFacebook } from "@/components/admin/AdminSocialFacebook";
import { AdminSocialInstagram } from "@/components/admin/AdminSocialInstagram";
import type { FacebookDiagnostics, FacebookReport } from "@/lib/facebook-server";
import type { InstagramDiagnostics, InstagramReport } from "@/lib/instagram-server";

const TABS = [
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
  if (tabParam === "clicks") return "clicks";
  if (tabParam === "instagram") return "instagram";
  if (tabParam === "facebook") return "facebook";
  return "traffic";
}

export function AdminAnalyticsHub({
  instagramInitial = null,
  instagramStatus = null,
  facebookInitial = null,
  facebookStatus = null,
}: {
  instagramInitial?: InstagramReport | null;
  instagramStatus?: InstagramDiagnostics | null;
  facebookInitial?: FacebookReport | null;
  facebookStatus?: FacebookDiagnostics | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  function setTab(tab: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "traffic") params.delete("tab");
    else params.set("tab", tab);
    router.replace(`/admin/analytics?${params.toString()}`, { scroll: false });
  }

  const description =
    activeTab === "traffic"
      ? "Visitors and page views from Google Analytics 4"
      : activeTab === "instagram"
        ? "Posts, followers, and reach from @toolqz on Instagram"
        : activeTab === "facebook"
          ? "Page insights and posts from Toolqz on Facebook"
          : "Outbound Visit link clicks across your tools";

  const headerAction =
    activeTab === "traffic" ? (
      <Link
        href={GA4_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="admin-toolbar-btn"
      >
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
      <AdminPageHeader
        hideTitle
        title="Analytics"
        description={description}
        action={headerAction}
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

      {activeTab === "traffic" ? (
        <AdminSiteTraffic />
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
        <AdminAnalytics />
      )}
    </div>
  );
}
