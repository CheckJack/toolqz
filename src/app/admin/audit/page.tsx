import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAudit } from "@/components/admin/AdminAudit";
import { getSession } from "@/lib/auth";

export default async function AdminAuditPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin");

  return (
    <AdminShell user={session}>
      <AdminAudit />
    </AdminShell>
  );
}
