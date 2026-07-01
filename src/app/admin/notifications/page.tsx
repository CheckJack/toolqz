import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { getSession } from "@/lib/auth";

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading notifications...</p>}>
        <AdminNotifications />
      </Suspense>
    </AdminShell>
  );
}
