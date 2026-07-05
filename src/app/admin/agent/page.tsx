import { redirect } from "next/navigation";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth-routes";
import { AdminAgent } from "@/components/admin/AdminAgent";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminAgentPage() {
  const session = await getSession();
  if (!session) redirect(ADMIN_SIGN_IN_PATH);
  if (session.role !== "ADMIN" && session.role !== "MEMBER") redirect(ADMIN_SIGN_IN_PATH);

  return (
    <AdminShell user={session}>
      <AdminAgent />
    </AdminShell>
  );
}
