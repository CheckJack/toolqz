import { Suspense } from "react";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAnalyticsHub } from "@/components/admin/AdminAnalyticsHub";
import { getSession } from "@/lib/auth";
import { fetchAnalyticsOverview } from "@/lib/analytics-overview";
import {
  collectOverviewWarnings,
  notifyAnalyticsWarnings,
} from "@/lib/analytics-notifications";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  const params = await searchParams;
  const tab = params.tab ?? "overview";

  let overviewInitial = null;

  if (tab === "overview") {
    try {
      overviewInitial = await fetchAnalyticsOverview(params.range);
      void notifyAnalyticsWarnings(collectOverviewWarnings(overviewInitial), "overview");
    } catch {
      overviewInitial = null;
    }
  }

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading analytics...</p>}>
        <AdminAnalyticsHub overviewInitial={overviewInitial} />
      </Suspense>
    </AdminShell>
  );
}
