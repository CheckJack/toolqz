import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTeam } from "@/components/admin/AdminTeam";
import { getSession } from "@/lib/auth";

export default async function AdminTeamPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <AdminTeam currentUser={session} />
    </AdminShell>
  );
}
