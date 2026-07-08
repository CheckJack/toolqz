import { Suspense } from "react";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAnalyticsHub } from "@/components/admin/AdminAnalyticsHub";
import { getSession } from "@/lib/auth";
import { fetchFacebookReport, getFacebookDiagnostics } from "@/lib/facebook-server";
import { fetchInstagramReport, getInstagramDiagnostics } from "@/lib/instagram-server";
import { parseSocialRange } from "@/lib/meta-graph";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  const params = await searchParams;
  const range = parseSocialRange(params.range);
  const instagramStatus = getInstagramDiagnostics();
  const facebookStatus = getFacebookDiagnostics();

  let instagramInitial = null;
  let facebookInitial = null;

  if (params.tab === "instagram") {
    try {
      instagramInitial = await fetchInstagramReport(range);
    } catch {
      instagramInitial = null;
    }
  }

  if (params.tab === "facebook") {
    try {
      facebookInitial = await fetchFacebookReport(range);
    } catch {
      facebookInitial = null;
    }
  }

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading analytics...</p>}>
        <AdminAnalyticsHub
          instagramInitial={instagramInitial}
          instagramStatus={instagramStatus}
          facebookInitial={facebookInitial}
          facebookStatus={facebookStatus}
        />
      </Suspense>
    </AdminShell>
  );
}
