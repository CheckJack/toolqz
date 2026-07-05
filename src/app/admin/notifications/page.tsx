import { Suspense } from "react";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { getSession } from "@/lib/auth";

export default async function AdminNotificationsPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <Suspense fallback={<p className="text-muted">Loading notifications...</p>}>
        <AdminNotifications />
      </Suspense>
    </AdminShell>
  );
}
