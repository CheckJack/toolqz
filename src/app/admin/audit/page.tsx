import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { getSession } from "@/lib/auth";

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);
  if (session.role !== "ADMIN") redirect("/admin");

  return (
    <AdminShell user={session}>
      <AdminAudit />
    </AdminShell>
  );
}
