import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { getSession } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <AdminSettings />
    </AdminShell>
  );
}
