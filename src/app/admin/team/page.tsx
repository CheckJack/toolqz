import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTeam } from "@/components/admin/AdminTeam";
import { getSession } from "@/lib/auth";

export default async function AdminTeamPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <AdminTeam currentUser={session} />
    </AdminShell>
  );
}
