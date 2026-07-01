import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { getSession } from "@/lib/auth";

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading analytics...</p>}>
        <AdminAnalytics />
      </Suspense>
    </AdminShell>
  );
}
