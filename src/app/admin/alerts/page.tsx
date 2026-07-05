import { redirect } from "next/navigation";
import { AdminAlerts } from "@/components/admin/AdminAlerts";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { getSession } from "@/lib/auth";

export default async function AdminAlertsPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);
  if (session.role !== "ADMIN") redirect("/admin");

  return (
    <AdminShell user={session}>
      <AdminAlerts />
    </AdminShell>
  );
}
