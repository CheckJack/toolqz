import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { getSession } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <AdminSettings />
    </AdminShell>
  );
}
