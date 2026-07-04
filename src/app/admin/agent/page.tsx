import { redirect } from "next/navigation";
import { AdminAgent } from "@/components/admin/AdminAgent";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth";

export default async function AdminAgentPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN" && session.role !== "MEMBER") redirect("/admin/login");

  return (
    <AdminShell user={session}>
      <AdminAgent />
    </AdminShell>
  );
}
